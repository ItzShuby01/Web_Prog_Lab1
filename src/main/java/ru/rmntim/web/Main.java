package ru.rmntim.web;

import com.fastcgi.FCGIInterface;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

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
    private static final String RESULT_JSON = """
            {
                "time": "%s",
                "now": "%s",
                "result": %b
            }
            """;
    private static final String ERROR_JSON = """
            {
                "now": "%s",
                "reason": "%s"
            }
            """;


    public static void main(String[] args) {
        var fcgi = new FCGIInterface();
        while (fcgi.FCGIaccept() >= 0) {
            try {
                var queryParams = System.getProperties().getProperty("QUERY_STRING");
                var params = new Params(queryParams);

                var startTime = Instant.now();
                var result = calculate(params.getX(), params.getY(), params.getR());
                var endTime = Instant.now();

                var json = String.format(RESULT_JSON, ChronoUnit.NANOS.between(startTime, endTime), LocalDateTime.now(), result);
                var response = String.format(HTTP_RESPONSE, json.getBytes(StandardCharsets.UTF_8).length + 2, json);
                System.out.println(response);
            } catch (ValidationException e) {
                var json = String.format(ERROR_JSON, LocalDateTime.now(), e.getMessage());
                var response = String.format(HTTP_ERROR, json.getBytes(StandardCharsets.UTF_8).length + 2, json);
                System.out.println(response);
            }
        }
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