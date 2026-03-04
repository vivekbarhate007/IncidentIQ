package com.incidentiq.repository;

import com.incidentiq.model.AuditEvent;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.Instant;
import java.util.List;

public interface AuditEventRepository extends MongoRepository<AuditEvent, String> {
    List<AuditEvent> findByTsBetween(Instant start, Instant end);
}
