package com.incidentiq.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.List;

@Data
@Document(collection = "orders")
public class Order {
    @Id
    private String id;
    @Indexed
    private String userId;
    private List<OrderItem> items;
    private String status; // CREATED, CANCELLED, COMPLETED
    @Indexed
    private Instant createdAt;
    private Instant updatedAt;
    @Indexed(unique = true)
    private String idempotencyKey;

    @Data
    public static class OrderItem {
        private String sku;
        private int qty;
    }
}
