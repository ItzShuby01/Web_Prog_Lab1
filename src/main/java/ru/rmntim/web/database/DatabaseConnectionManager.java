package ru.rmntim.web.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConnectionManager {
    private final String jdbcUrl;
    private final String dbUsername;
    private final String dbPassword;

    // My PSQL studs DB credentials
    public DatabaseConnectionManager() {
        this.jdbcUrl = "jdbc:postgresql://pg:5432/studs";
        this.dbUsername = "s463221";
        this.dbPassword = System.getenv("DB_PASSWORD");
        if(this.dbPassword == null) {
            throw new IllegalStateException("Environment variable DB_PASSWORD is not set");
        }
        try {
            // Ensures the PostgreSQL driver is loaded
            Class.forName("org.postgresql.Driver");
        } catch (ClassNotFoundException e) {
            System.err.println("PostgreSQL JDBC Driver not found!");
        }
    }

    public Connection getConnection() throws SQLException {
        return DriverManager.getConnection(jdbcUrl, dbUsername, dbPassword);
    }
}