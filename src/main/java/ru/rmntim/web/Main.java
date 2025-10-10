package ru.rmntim.web;

import com.fastcgi.FCGIInterface;
import com.fasterxml.jackson.databind.ObjectMapper; // For JSON serialization
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule; //For  LocalDateTime serialization
import ru.rmntim.web.database.CalculationResultDAO;
import ru.rmntim.web.database.DatabaseConnectionManager;

import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

public class Main {
    private static final String HTTP_RESPONSE = """
            HTTP/1.1 200 OK
            Content-Type: application/json
            Content-Length: %d
            
            %s
            """;
    private static final String HTTP_ERROR = """
            HTTP/1.1 400 Bad Request
            Content-Type: application/json
            Content-Length: %d
            
            %s
            """;

    private static final String ERROR_JSON = """
            {
                "now": "%s",
                "reason": "%s"
            }
            """;

    private static final DatabaseConnectionManager connectionManager = new DatabaseConnectionManager();
    private static final CalculationResultDAO resultDAO = new CalculationResultDAO(connectionManager);
    private static final ObjectMapper objectMapper = new ObjectMapper(); // Jackson for JSON
    static {
        objectMapper.registerModule(new JavaTimeModule()); // Register module for LocalDateTime
    }

    public static void main(String[] args) {
        var fcgi = new FCGIInterface();
        while (fcgi.FCGIaccept() >= 0) {
            try {
                var queryParams = System.getProperties().getProperty("QUERY_STRING");

                // Check if it's a request to clear results
                if ("clear_results".equals(queryParams)) {
                    resultDAO.clearAllResults();
                    sendJsonResponse(objectMapper.createObjectNode().put("message", "Results cleared successfully").toString());
                    continue; // Process next request
                }

                // Check if it's a request to get all results
                if ("get_all_results".equals(queryParams)) {
                    List<CalculationResult> allResults = resultDAO.getAllResults();
                    ArrayNode resultsArray = objectMapper.createArrayNode();
                    for (CalculationResult res : allResults) {
                        ObjectNode node = objectMapper.createObjectNode();
                        node.put("x", res.getX());
                        node.put("y", res.getY());
                        node.put("r", res.getR());
                        node.put("time", res.getTimestamp().toString()); // LocalDateTime to string
                        node.put("execTime", res.getExecutionTimeNanos() / 1_000_000.0); // Convert nanos to ms
                        node.put("result", res.isHit());
                        resultsArray.add(node);
                    }
                    sendJsonResponse(resultsArray.toString());
                    continue; // Process next request
                }

                //Process new calculation
                var params = new Params(queryParams);

                var startTime = Instant.now();
                var result = calculate(params.getX(), params.getY(), params.getR());
                var endTime = Instant.now();
                long executionTimeNanos = ChronoUnit.NANOS.between(startTime, endTime);
                LocalDateTime currentServerTime = LocalDateTime.now();

                // Save the result to the database
                CalculationResult newCalcResult = new CalculationResult(
                        params.getX(), params.getY(), params.getR(), result,
                        currentServerTime, executionTimeNanos
                );
                resultDAO.saveResult(newCalcResult);

                // Send back the current calculation result (for immediate display on frontend)
                ObjectNode jsonNode = objectMapper.createObjectNode();
                jsonNode.put("x", params.getX());
                jsonNode.put("y", params.getY());
                jsonNode.put("r", params.getR());
                jsonNode.put("time", currentServerTime.toString());
                jsonNode.put("execTime", executionTimeNanos / 1_000_000.0); // Convert nanos to ms for frontend
                jsonNode.put("result", result);

                sendJsonResponse(jsonNode.toString());

            } catch (ValidationException e) {
                sendErrorResponse(e.getMessage());
            } catch (SQLException e) {
                System.err.println("Database error: " + e.getMessage());
                sendErrorResponse("Database error: " + e.getMessage());
            } catch (Exception e) { // Catch any other unexpected errors
                System.err.println("Server error: " + e.getMessage());
                sendErrorResponse("Internal server error.");
            }
        }
    }

    private static void sendJsonResponse(String json) {
        var response = String.format(HTTP_RESPONSE, json.getBytes(StandardCharsets.UTF_8).length, json);
        System.out.println(response);
    }

    private static void sendErrorResponse(String reason) {
        var json = String.format(ERROR_JSON, LocalDateTime.now().toString(), reason);
        var response = String.format(HTTP_ERROR, json.getBytes(StandardCharsets.UTF_8).length, json);
        System.out.println(response);
    }

    private static boolean calculate(float x, float y, float r) {
        // 1st Quadrant: Triangle
        // Conditions: x >= 0, y >= 0, and y <= R/2 - x (or x + y <= R/2)
        boolean inTriangle = x >= 0 && y >= 0 && (x + y) <= r / 2.0;

        //2nd Quadrant: empty, so no check needed.

        // 3rd Quadrant:  Rectangle
        // Conditions: -R <= x <= 0, and -R/2 <= y <= 0
        boolean inRectangle = x <= 0 && x >= -r && y <= 0 && y >= -r / 2.0;

        // 4th Quadrant: Quarter Circle
        // Conditions: x >= 0, y <= 0, and x^2 + y^2 <= (R/2)^2
        float radiusSquared = (r / 2.0f) * (r / 2.0f);
        boolean inCircle = x >= 0 && y <= 0 && (x * x + y * y) <= radiusSquared;

        // The point is a hit if it is in the triangle, the rectangle, or the quarter circle
        return inTriangle || inRectangle || inCircle;

    }
}