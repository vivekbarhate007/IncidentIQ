package com.incidentiq.repository;

import com.incidentiq.model.Order;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface OrderRepository extends MongoRepository<Order, String> {
    Optional<Order> findByIdempotencyKey(String idempotencyKey);
}
