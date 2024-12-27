# Operations Guide

## System Configuration

### Environment Variables

#### Core Settings
```env
# Server
PORT=3001
HOST=localhost
NODE_ENV=production

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=goldmap
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Logging
LOG_LEVEL=info
```

#### Data Collection Settings
```env
# Rate Limiting
RATE_LIMIT_PER_SECOND=2
REQUEST_TIMEOUT=30000

# Geographic Bounds
DEFAULT_MIN_LON=-124.4071825
DEFAULT_MAX_LON=-122.3933314
DEFAULT_MIN_LAT=40.0711794
DEFAULT_MAX_LAT=41.7410164
```

### Configuration Files

1. `turbo.json` - Build pipeline configuration
2. `docker-compose.yml` - Container orchestration
3. `tsconfig.json` - TypeScript configuration

## Monitoring

### System Health

1. Health Check Endpoints
   ```bash
   # Task Runner
   curl http://localhost:3001/health

   # API Gateway
   curl http://localhost:3000/health
   ```

2. Queue Status
   ```bash
   curl http://localhost:3001/api/queues/data-collection/status
   ```

3. Database Status
   ```sql
   -- Connection count
   SELECT count(*) FROM pg_stat_activity;

   -- Table sizes
   SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
   FROM pg_catalog.pg_statio_user_tables
   ORDER BY pg_total_relation_size(relid) DESC;
   ```

### Metrics

1. System Metrics
   - CPU Usage
   - Memory Usage
   - Disk Space
   - Network I/O

2. Application Metrics
   - Request Rate
   - Response Time
   - Error Rate
   - Queue Length

3. Data Metrics
   - Record Count
   - Update Frequency
   - Data Freshness
   - Storage Usage

### Logging

1. Application Logs
   ```bash
   # View service logs
   docker compose logs -f task-runner

   # View specific log level
   docker compose logs -f task-runner | grep ERROR
   ```

2. Database Logs
   ```bash
   # View PostgreSQL logs
   docker compose logs -f postgres
   ```

3. Queue Logs
   ```bash
   # View Redis logs
   docker compose logs -f redis
   ```

## Maintenance

### Database Maintenance

1. Backup
   ```bash
   # Create backup
   docker compose exec postgres pg_dump -U postgres goldmap > backup.sql

   # Restore backup
   docker compose exec -T postgres psql -U postgres goldmap < backup.sql
   ```

2. Optimization
   ```sql
   -- Analyze tables
   ANALYZE;

   -- Vacuum database
   VACUUM ANALYZE;

   -- Reindex
   REINDEX DATABASE goldmap;
   ```

3. Monitoring Queries
   ```sql
   -- Long-running queries
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query
   FROM pg_stat_activity
   WHERE pg_stat_activity.query != '<IDLE>'
   ORDER BY duration DESC;
   ```

### Queue Maintenance

1. Clear Queues
   ```bash
   # Access Redis CLI
   docker compose exec redis redis-cli

   # Clear specific queue
   DEL "gold-map:data-collection"
   ```

2. Monitor Queue Size
   ```bash
   # Check queue length
   LLEN "gold-map:data-collection"
   ```

3. View Failed Jobs
   ```bash
   # Check failed jobs
   LRANGE "gold-map:data-collection:failed" 0 -1
   ```

### System Updates

1. Update Services
   ```bash
   # Pull latest images
   docker compose pull

   # Update and restart
   docker compose up -d
   ```

2. Database Migrations
   ```bash
   # Run migrations
   pnpm typeorm migration:run
   ```

3. Cache Clear
   ```bash
   # Clear Redis cache
   docker compose exec redis redis-cli FLUSHDB
   ```

## Troubleshooting

### Common Issues

1. Service Not Starting
   - Check logs: `docker compose logs service-name`
   - Verify environment variables
   - Check disk space
   - Verify port availability

2. Database Connection Issues
   - Check PostgreSQL logs
   - Verify connection settings
   - Check network connectivity
   - Verify credentials

3. Queue Processing Issues
   - Check Redis connectivity
   - Verify job configuration
   - Check for failed jobs
   - Monitor queue size

### Recovery Procedures

1. Service Recovery
   ```bash
   # Restart service
   docker compose restart service-name

   # Check logs
   docker compose logs -f service-name
   ```

2. Database Recovery
   ```bash
   # Restore from backup
   docker compose exec -T postgres psql -U postgres goldmap < backup.sql

   # Verify data
   docker compose exec postgres psql -U postgres -d goldmap -c "SELECT count(*) FROM features;"
   ```

3. Queue Recovery
   ```bash
   # Clear and restart queues
   docker compose restart redis
   docker compose restart task-runner
   ```

## Security

### Access Control

1. API Authentication
   - Use API keys
   - Implement rate limiting
   - Monitor access logs

2. Database Security
   - Use strong passwords
   - Limit network access
   - Regular security updates

3. Service Security
   - Keep containers updated
   - Use secure configurations
   - Monitor for vulnerabilities

### Backup Strategy

1. Database Backups
   - Daily full backups
   - Hourly incremental backups
   - Off-site backup storage

2. Configuration Backups
   - Version control for configs
   - Document all changes
   - Backup environment files

3. Log Retention
   - Keep logs for 30 days
   - Archive important logs
   - Regular log rotation

## Scaling

### Horizontal Scaling

1. Add API Instances
   ```bash
   docker compose up -d --scale api=3
   ```

2. Add Task Runners
   ```bash
   docker compose up -d --scale task-runner=2
   ```

3. Database Scaling
   - Add read replicas
   - Implement sharding
   - Use connection pooling

### Performance Tuning

1. Database Tuning
   ```sql
   -- Adjust work_mem
   ALTER SYSTEM SET work_mem = '32MB';

   -- Adjust shared_buffers
   ALTER SYSTEM SET shared_buffers = '1GB';
   ```

2. Application Tuning
   - Optimize batch sizes
   - Adjust concurrency
   - Configure caching

3. Infrastructure Tuning
   - Optimize container resources
   - Configure load balancing
   - Tune network settings
