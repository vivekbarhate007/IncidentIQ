package com.incidentiq.controller;

import com.incidentiq.model.Order;
import com.incidentiq.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public Order createOrder(@RequestBody Order order, 
                             @RequestHeader("Idempotency-Key") String idempotencyKey,
                             @AuthenticationPrincipal Jwt jwt) {
        order.setUserId(jwt.getSubject());
        return orderService.createOrder(order, idempotencyKey);
    }

    @GetMapping("/{id}")
    public Order getOrder(@PathVariable String id) {
        return orderService.getOrder(id);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public Order cancelOrder(@PathVariable String id) {
        return orderService.cancelOrder(id);
    }
}
