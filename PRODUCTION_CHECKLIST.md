# Production Deployment Checklist

## Security
- [ ] Validate file types and sizes on both frontend and backend (only allow images and 3D models, max 10MB)
- [ ] Sanitize all user input for CRUD endpoints
- [ ] Do not expose stack traces or sensitive error details in production
- [ ] Add authentication and authorization for all admin endpoints (e.g., file upload, CRUD)
- [ ] Ensure `public/uploads` is not world-writable and is not exposed to directory listing
- [ ] Consider virus scanning for uploaded files
- [ ] Use HTTPS in production

## Performance
- [ ] Use streaming for large file uploads if needed
- [ ] Serve static files (uploads) via CDN in production
- [ ] Optimize images and 3D models for web delivery

## Reliability
- [ ] Ensure all API endpoints always send a response and return
- [ ] Add logging for critical errors (avoid logging sensitive data)
- [ ] Ensure `public/uploads` is persisted and backed up
- [ ] Set correct permissions on upload directory

## Testing
- [ ] Write integration tests for file upload and CRUD endpoints
- [ ] Test with large files and edge cases (unsupported file types, duplicate uploads, etc.)
- [ ] Test authentication and authorization for admin endpoints
- [ ] Test the full flow in a production-like environment

## Monitoring
- [ ] Set up error monitoring and alerting (e.g., Sentry, LogRocket)
- [ ] Monitor disk usage for uploads directory

## Documentation
- [ ] Document API endpoints and expected request/response formats
- [ ] Document admin workflows for file and asset management

---

**Review this checklist before every production deployment to ensure a robust, secure, and reliable system.** 