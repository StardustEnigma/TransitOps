package com.transitops_backend.exception;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(ResourceNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<Map<String, Object>> handleBusinessRule(BusinessRuleException ex) {
        return buildResponse(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return buildResponse(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, "You do not have permission to perform this action");
    }

    /**
     * Handles @Valid DTO-level validation errors (e.g. @NotBlank, @Email on request DTOs).
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Validation Failed");
        body.put("message", "One or more fields failed validation");
        body.put("fieldErrors", fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * Handles JPA/Hibernate entity-level constraint violations
     * (e.g. @NotBlank, @Pattern, @Email on entity fields that pass DTO validation but fail at persist time).
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (ConstraintViolation<?> violation : ex.getConstraintViolations()) {
            String field = violation.getPropertyPath().toString();
            // Extract just the field name (e.g., "contactNumber" from "createDriver.request.contactNumber")
            if (field.contains(".")) {
                field = field.substring(field.lastIndexOf('.') + 1);
            }
            fieldErrors.put(field, violation.getMessage());
        }
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Validation Failed");
        body.put("message", fieldErrors.values().stream().collect(Collectors.joining(", ")));
        body.put("fieldErrors", fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * Handles malformed JSON or unreadable request bodies
     * (e.g. invalid enum values, type mismatches in JSON payload).
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleMessageNotReadable(HttpMessageNotReadableException ex) {
        String msg = "Malformed or unreadable request body";
        Throwable cause = ex.getCause();
        if (cause != null) {
            String causeMsg = cause.getMessage();
            if (causeMsg != null && causeMsg.contains("Cannot deserialize value of type")) {
                // Extract a user-friendly message from Jackson deserialization errors
                int idx = causeMsg.indexOf("from String");
                if (idx > 0) {
                    msg = "Invalid value: " + causeMsg.substring(0, Math.min(idx + 30, causeMsg.length()));
                } else {
                    msg = causeMsg.length() > 200 ? causeMsg.substring(0, 200) : causeMsg;
                }
            }
        }
        return buildResponse(HttpStatus.BAD_REQUEST, msg);
    }

    /**
     * Handles type mismatch in request parameters (e.g. sending "abc" for a Long path variable).
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String msg = String.format("Invalid value '%s' for parameter '%s'. Expected type: %s",
                ex.getValue(), ex.getName(),
                ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown");
        return buildResponse(HttpStatus.BAD_REQUEST, msg);
    }

    /**
     * Handles database-level unique constraint violations and integrity errors.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
        String msg = "Data integrity violation";
        Throwable root = ex.getRootCause();
        if (root != null && root.getMessage() != null) {
            String rootMsg = root.getMessage().toLowerCase();
            if (rootMsg.contains("unique") || rootMsg.contains("duplicate")) {
                msg = "A record with the given unique value already exists. Please use a different value.";
            } else if (rootMsg.contains("foreign key") || rootMsg.contains("fk_")) {
                msg = "Cannot complete operation: referenced record does not exist or is still in use.";
            } else if (rootMsg.contains("not-null") || rootMsg.contains("null")) {
                msg = "A required field was missing or null.";
            }
        }
        return buildResponse(HttpStatus.CONFLICT, msg);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred: " + ex.getMessage());
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}

