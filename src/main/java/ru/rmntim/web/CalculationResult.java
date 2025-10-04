package ru.rmntim.web;

import java.time.LocalDateTime;

public class CalculationResult {
    private int id; // Database PK
    private  final float x;
    private final float y;
    private final float r;
    private final boolean hit;
    private final LocalDateTime timestamp;
    private final long executionTimeNanos; // Store as long, format to milliseconds on frontend

    // Constructor for new results (without ID)
    public CalculationResult(float x, float y, float r, boolean hit, LocalDateTime timestamp, long executionTimeNanos) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.hit = hit;
        this.timestamp = timestamp;
        this.executionTimeNanos = executionTimeNanos;
    }

    // Constructor for results loaded from DB (with ID)
    public CalculationResult(int id, float x, float y, float r, boolean hit, LocalDateTime timestamp, long executionTimeNanos) {
        this(x, y, r, hit, timestamp, executionTimeNanos);
        this.id = id;
    }

    // Getters
    public int getId() { return id; }
    public float getX() { return x; }
    public float getY() { return y; }
    public float getR() { return r; }
    public boolean isHit() { return hit; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public long getExecutionTimeNanos() { return executionTimeNanos; }

    @Override
    public String toString() {
        return "CalculationResult{" +
                "id=" + id +
                ", x=" + x +
                ", y=" + y +
                ", r=" + r +
                ", hit=" + hit +
                ", timestamp=" + timestamp +
                ", executionTimeNanos=" + executionTimeNanos +
                '}';
    }
}