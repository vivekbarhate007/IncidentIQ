package com.incidentiq.filter;

import com.incidentiq.model.AuditEvent;
import com.incidentiq.repository.AuditEventRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.time.Instant;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class LoggingFilter implements Filter {
    private final AuditEventRepository auditEventRepository;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String correlationId = req.getHeader("X-Correlation-ID");
        if (correlationId == null) correlationId = UUID.randomUUID().toString();
        String traceId = UUID.randomUUID().toString();

        MDC.put("correlationId", correlationId);
        MDC.put("traceId", traceId);
        res.setHeader("X-Correlation-ID", correlationId);

        long start = System.currentTimeMillis();
        try {
            chain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - start;
            
            // Async-ish audit logging
            AuditEvent event = new AuditEvent();
            event.setTs(Instant.now());
            event.setMethod(req.getMethod());
            event.setPath(req.getRequestURI());
            event.setStatus(res.getStatus());
            event.setLatencyMs(duration);
            event.setCorrelationId(correlationId);
            event.setTraceId(traceId);
            
            try {
                auditEventRepository.save(event);
            } catch (Exception e) {
                // Don't fail the request if audit logging fails
            }
            
            MDC.clear();
        }
    }
}
