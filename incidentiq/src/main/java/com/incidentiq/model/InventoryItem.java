package com.incidentiq.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Data
@Document(collection = "inventory")
public class InventoryItem {
    @Id
    private String id;
    @Indexed(unique = true)
    private String sku;
    private int availableQty;
    private int reservedQty;
    private Instant updatedAt;
}
