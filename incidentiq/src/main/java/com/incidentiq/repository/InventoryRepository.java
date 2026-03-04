package com.incidentiq.repository;

import com.incidentiq.model.InventoryItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface InventoryRepository extends MongoRepository<InventoryItem, String> {
    Optional<InventoryItem> findBySku(String sku);
}
