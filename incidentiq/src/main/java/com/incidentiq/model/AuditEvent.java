package com.incidentiq.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Data
@Document(collection = "audit_events")
public class AuditEvent {
    @Id
    private String id;
    @Indexed
    private Instant ts;
    private String method;
    private String path;
    private int status;
    private long latencyMs;
    private String userRole;
    private String correlationId;
    private String traceId;
    private String orderId;
}
