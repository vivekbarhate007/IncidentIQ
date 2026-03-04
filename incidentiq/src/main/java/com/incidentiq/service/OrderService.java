package com.incidentiq.service;

import com.incidentiq.model.Order;
import com.incidentiq.model.InventoryItem;
import com.incidentiq.repository.OrderRepository;
import com.incidentiq.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;

    @Transactional
    public Order createOrder(Order order, String idempotencyKey) {
        return orderRepository.findByIdempotencyKey(idempotencyKey)
                .orElseGet(() -> {
                    // Simple inventory check & reservation
                    for (Order.OrderItem item : order.getItems()) {
                        InventoryItem inv = inventoryRepository.findBySku(item.getSku())
                                .orElseThrow(() -> new RuntimeException("SKU not found: " + item.getSku()));
                        if (inv.getAvailableQty() < item.getQty()) {
                            throw new RuntimeException("Insufficient stock for SKU: " + item.getSku());
                        }
                        inv.setAvailableQty(inv.getAvailableQty() - item.getQty());
                        inv.setReservedQty(inv.getReservedQty() + item.getQty());
                        inv.setUpdatedAt(Instant.now());
                        inventoryRepository.save(inv);
                    }

                    order.setId(UUID.randomUUID().toString());
                    order.setIdempotencyKey(idempotencyKey);
                    order.setStatus("CREATED");
                    order.setCreatedAt(Instant.now());
                    order.setUpdatedAt(Instant.now());
                    return orderRepository.save(order);
                });
    }

    public Order getOrder(String id) {
        return orderRepository.findById(id).orElseThrow();
    }

    @Transactional
    public Order cancelOrder(String id) {
        Order order = orderRepository.findById(id).orElseThrow();
        if (!"CREATED".equals(order.getStatus())) {
            throw new RuntimeException("Cannot cancel order in status: " + order.getStatus());
        }
        
        // Release inventory
        for (Order.OrderItem item : order.getItems()) {
            InventoryItem inv = inventoryRepository.findBySku(item.getSku()).orElseThrow();
            inv.setAvailableQty(inv.getAvailableQty() + item.getQty());
            inv.setReservedQty(inv.getReservedQty() - item.getQty());
            inv.setUpdatedAt(Instant.now());
            inventoryRepository.save(inv);
        }

        order.setStatus("CANCELLED");
        order.setUpdatedAt(Instant.now());
        return orderRepository.save(order);
    }
}
