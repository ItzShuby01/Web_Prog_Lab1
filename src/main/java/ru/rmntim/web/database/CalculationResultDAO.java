package ru.rmntim.web.database;

import ru.rmntim.web.CalculationResult;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CalculationResultDAO {

    private final DatabaseConnectionManager connectionManager;

    public CalculationResultDAO(DatabaseConnectionManager connectionManager) {
        this.connectionManager = connectionManager;
    }

    public void saveResult(CalculationResult result) throws SQLException {
        String sql = "INSERT INTO calculation_results (x, y, r, is_hit, timestamp, execution_time_nanos) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setFloat(1, result.getX());
            pstmt.setFloat(2, result.getY());
            pstmt.setFloat(3, result.getR());
            pstmt.setBoolean(4, result.isHit());
            pstmt.setTimestamp(5, Timestamp.valueOf(result.getTimestamp()));
            pstmt.setLong(6, result.getExecutionTimeNanos());
            pstmt.executeUpdate();
        }
    }

    public List<CalculationResult> getAllResults() throws SQLException {
        List<CalculationResult> results = new ArrayList<>();
        String sql = "SELECT id, x, y, r, is_hit, timestamp, execution_time_nanos FROM calculation_results ORDER BY timestamp DESC"; // Order by most recent first
        try (Connection conn = connectionManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                results.add(new CalculationResult(
                        rs.getInt("id"),
                        rs.getFloat("x"),
                        rs.getFloat("y"),
                        rs.getFloat("r"),
                        rs.getBoolean("is_hit"),
                        rs.getTimestamp("timestamp").toLocalDateTime(),
                        rs.getLong("execution_time_nanos")
                ));
            }
        }
        return results;
    }

    public void clearAllResults() throws SQLException {
        String sql = "DELETE FROM calculation_results";
        try (Connection conn = connectionManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.executeUpdate();
        }
    }
}