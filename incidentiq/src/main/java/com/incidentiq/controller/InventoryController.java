package com.incidentiq.controller;

import com.incidentiq.model.InventoryItem;
import com.incidentiq.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryRepository inventoryRepository;

    @GetMapping("/{sku}")
    @PreAuthorize("hasAnyRole('OPS', 'ADMIN')")
    public InventoryItem getInventory(@PathVariable String sku) {
        return inventoryRepository.findBySku(sku).orElseThrow();
    }

    @PostMapping("/seed")
    @PreAuthorize("hasRole('ADMIN')")
    public List<InventoryItem> seedInventory(@RequestBody List<InventoryItem> items) {
        items.forEach(i -> i.setUpdatedAt(Instant.now()));
        return inventoryRepository.saveAll(items);
    }
}
