# Manual Deployment Guide - BengoERP UI

This guide provides step-by-step procedures for manually deploying the BengoERP UI when automated workflows are unavailable or require manual intervention.

## Prerequisites

- Access to the Contabo VPS server with kubectl configured
- Access to container registry (Docker Hub)
- Git access to repositories
- ArgoCD CLI installed and configured

## 1. Manual ArgoCD Application Deployment

### Apply ArgoCD Application
```bash
# Navigate to devops-k8s directory
cd /path/to/devops-k8s

# Apply the ERP UI ArgoCD application
kubectl apply -f apps/erp-ui/app.yaml -n argocd

# Verify application is created
kubectl get applications.argoproj.io erp-ui -n argocd
```

### Monitor Deployment Progress
```bash
# Watch application status
kubectl get applications.argoproj.io erp-ui -n argocd -w

# Get detailed application information
argocd app get erp-ui

# Check application health and sync status
argocd app get erp-ui --health
kubectl get applications.argoproj.io erp-ui -n argocd -o jsonpath='{.status.sync.status}'
```

## 2. Manual Resource Management

### Check Deployed Resources
```bash
# Check all resources in erp namespace
kubectl get all,ingress,secrets,pvc -n erp

# Check specific deployments
kubectl get deployment erp-ui -n erp
kubectl get service erp-ui -n erp
kubectl get ingress -n erp
```

### View Application Logs
```bash
# Get pod names
kubectl get pods -n erp -l app=erp-ui

# View logs for UI pods
kubectl logs -f deployment/erp-ui -n erp

# View logs for specific pods
kubectl logs -f erp-ui-<pod-suffix> -n erp
```

### Check Service Endpoints
```bash
# Check service status
kubectl get svc erp-ui -n erp

# Check ingress configuration
kubectl get ingress -n erp -o yaml
kubectl describe ingress erp-ui -n erp
```

## 3. Certificate Management

### Check Certificate Status
```bash
# Check cert-manager certificates
kubectl get certificates -n erp

# Check certificate details
kubectl describe certificate erp-masterspace-tls -n erp

# Check certificate readiness
kubectl get certificates -n erp -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}'
```

### Manual Certificate Renewal
```bash
# Force certificate renewal if needed
kubectl annotate certificate erp-masterspace-tls -n erp cert-manager.io/issue-temporary-certificate="true"

# Check certificate events
kubectl get events -n erp --field-selector involvedObject.kind=Certificate
```

## 4. Certificate Management and Domain Assignment

### Certificate Status Monitoring
```bash
# Check cert-manager certificates
kubectl get certificates -n erp

# Check certificate details
kubectl describe certificate erp-masterspace-tls -n erp

# Check certificate readiness
kubectl get certificates -n erp -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}'

# Check certificate expiration
kubectl get certificates -n erp -o jsonpath='{.items[*].status.notAfter}'
```

### Manual Certificate Renewal
```bash
# Force certificate renewal if needed
kubectl annotate certificate erp-masterspace-tls -n erp cert-manager.io/issue-temporary-certificate="true"

# Check certificate events
kubectl get events -n erp --field-selector involvedObject.kind=Certificate

# Check cert-manager logs for issues
kubectl logs -n cert-manager deployment/cert-manager -f
```

### Certificate Troubleshooting
```bash
# Check if certificate secret exists
kubectl get secret erp-masterspace-tls -n erp

# Check certificate secret contents
kubectl get secret erp-masterspace-tls -n erp -o yaml

# Check Let's Encrypt challenge status
kubectl get challenges -n erp

# Check cert-manager webhook logs
kubectl logs -n cert-manager deployment/cert-manager-webhook -f
```

### Domain Assignment and DNS Configuration

#### DNS Configuration Check
```bash
# Check if domains resolve correctly
nslookup erpapi.masterspace.co.ke
nslookup erp.masterspace.co.ke

# Check DNS propagation (should point to LoadBalancer IP)
kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

#### Domain Verification Procedures
```bash
# Check if domains are configured in ingress
kubectl get ingress -n erp -o yaml | grep -A 5 "hosts:"

# Verify ingress class configuration
kubectl get ingressclass nginx -o yaml

# Check ingress controller configuration
kubectl describe ingressclass nginx
```

#### Manual Domain Assignment
```bash
# Update ingress with domain assignment (if needed)
kubectl patch ingress erp-api -n erp --type='merge' -p='{
  "spec": {
    "tls": [{
      "hosts": ["erpapi.masterspace.co.ke"],
      "secretName": "erpapi-masterspace-tls"
    }]
  }
}'

# Update UI ingress domain assignment
kubectl patch ingress erp-ui -n erp --type='merge' -p='{
  "spec": {
    "tls": [{
      "hosts": ["erp.masterspace.co.ke"],
      "secretName": "erp-masterspace-tls"
    }]
  }
}'
```

### Certificate Issuance Troubleshooting

#### Check ACME Challenge Status
```bash
# Check if ACME challenges are being created
kubectl get challenges -n erp

# Check challenge details
kubectl describe challenge -n erp -l app.kubernetes.io/name=cert-manager

# Check if challenges are being solved
kubectl get challenges -n erp -o jsonpath='{.items[*].status.state}'
```

#### Manual Challenge Creation
```bash
# Manually trigger challenge creation (advanced)
kubectl annotate certificate erp-masterspace-tls -n erp cert-manager.io/issue-temporary-certificate="true"

# Check challenge solver logs
kubectl logs -n cert-manager deployment/cert-manager -f | grep -i challenge
```

#### DNS Propagation Verification
```bash
# Check if DNS points to correct LoadBalancer IP
LB_IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "Expected LoadBalancer IP: $LB_IP"

# Verify DNS resolution
dig erpapi.masterspace.co.ke @8.8.8.8
dig erp.masterspace.co.ke @8.8.8.8

# Check if DNS TTL is appropriate
dig erpapi.masterspace.co.ke @8.8.8.8 | grep -i ttl
```

### SSL/TLS Testing

#### Certificate Validation
```bash
# Test SSL certificate validity
echo | openssl s_client -servername erpapi.masterspace.co.ke -connect erpapi.masterspace.co.ke:443 2>/dev/null | openssl x509 -noout -dates

# Check certificate chain
echo | openssl s_client -servername erpapi.masterspace.co.ke -connect erpapi.masterspace.co.ke:443 2>/dev/null | openssl x509 -noout -text | grep -A 5 "Issuer:"

# Test HTTPS connectivity
curl -v -k https://erpapi.masterspace.co.ke/api/v1/health/
curl -v -k https://erp.masterspace.co.ke/
```

#### Security Headers Check
```bash
# Check security headers
curl -I -k https://erpapi.masterspace.co.ke/api/v1/health/ | grep -i "strict-transport-security\|content-security-policy\|x-frame-options"

# Test HSTS header
curl -I -k https://erpapi.masterspace.co.ke/api/v1/health/ | grep -i "strict-transport-security"
```

### Domain Migration Procedures

#### Update Domain Configuration
```bash
# Update ingress hosts if domain changes
kubectl patch ingress erp-api -n erp --type='merge' -p='{
  "spec": {
    "rules": [{
      "host": "new-domain.com",
      "http": {
        "paths": [{
          "path": "/",
          "pathType": "Prefix",
          "backend": {
            "service": {
              "name": "erp-api",
              "port": {"number": 80}
            }
          }
        }]
      }
    }]
  }
}'

# Update TLS configuration for new domain
kubectl patch certificate erp-masterspace-tls -n erp --type='merge' -p='{
  "spec": {
    "dnsNames": ["new-domain.com"]
  }
}'
```

#### Certificate Recreation
```bash
# Delete and recreate certificate for domain changes
kubectl delete certificate erp-masterspace-tls -n erp
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: erp-masterspace-tls
  namespace: erp
spec:
  secretName: erp-masterspace-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - erpapi.masterspace.co.ke
  - erp.masterspace.co.ke
EOF
```

### Ingress Controller Troubleshooting

#### Check Ingress Controller Status
```bash
# Check ingress controller pods
kubectl get pods -n ingress-nginx -l app.kubernetes.io/component=controller

# Check ingress controller logs
kubectl logs -f deployment/ingress-nginx-controller -n ingress-nginx

# Check ingress controller configuration
kubectl get ingressclass nginx -o yaml
```

#### Ingress LoadBalancer Issues
```bash
# Check LoadBalancer service status
kubectl describe svc ingress-nginx-controller -n ingress-nginx

# Check LoadBalancer events
kubectl get events -n ingress-nginx --field-selector involvedObject.name=ingress-nginx-controller

# Check if LoadBalancer IP is assigned
kubectl get svc ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

### Advanced Certificate Operations

#### Certificate Details Inspection
```bash
# Get detailed certificate information
kubectl get certificate erp-masterspace-tls -n erp -o yaml

# Check certificate secret contents
kubectl get secret erp-masterspace-tls -n erp -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -text

# Check private key
kubectl get secret erp-masterspace-tls -n erp -o jsonpath='{.data.tls\.key}' | base64 -d | openssl rsa -noout -text
```

#### Certificate Chain Validation
```bash
# Download certificate for offline inspection
kubectl get secret erp-masterspace-tls -n erp -o jsonpath='{.data.tls\.crt}' | base64 -d > /tmp/cert.pem
kubectl get secret erp-masterspace-tls -n erp -o jsonpath='{.data.tls\.key}' | base64 -d > /tmp/key.pem

# Validate certificate chain
openssl verify -CAfile /tmp/cert.pem /tmp/cert.pem

# Check certificate expiry
openssl x509 -in /tmp/cert.pem -noout -dates
```

## 5. Application Updates

### Update Application Image Tag
```bash
# Edit ArgoCD application to update image tag
kubectl edit application erp-ui -n argocd

# Or patch the application with new image tag
kubectl patch application erp-ui -n argocd --type='merge' -p='{
  "spec": {
    "source": {
      "helm": {
        "values": "image:\n  repository: docker.io/codevertex/erp-ui\n  tag: new-tag-here\n"
      }
    }
  }
}'
```

### Force Application Sync
```bash
# Force sync the application
argocd app sync erp-ui --force

# Sync with pruning (removes outdated resources)
argocd app sync erp-ui --prune

# Sync specific resources only
argocd app sync erp-ui --resource deployment/erp-ui --resource service/erp-ui
```

## 6. Troubleshooting Commands

### Common Troubleshooting Steps
```bash
# Check ArgoCD application controller status
kubectl get pods -n argocd -l app.kubernetes.io/name=argocd-application-controller

# Check ArgoCD application controller logs
kubectl logs -f deployment/argocd-application-controller -n argocd

# Check application events
kubectl get events -n argocd --field-selector involvedObject.name=erp-ui

# Check for stuck applications
kubectl get applications.argoproj.io erp-ui -n argocd -o jsonpath='{.status.sync.status}'
```

### Network Troubleshooting
```bash
# Check if UI service is accessible
kubectl port-forward svc/erp-ui 3000:80 -n erp

# Test UI accessibility
curl http://localhost:3000

# Check UI logs during request
kubectl logs -f deployment/erp-ui -n erp --tail=100
```

### Resource Issues
```bash
# Check resource usage
kubectl top pods -n erp
kubectl top nodes

# Check for resource constraints
kubectl describe pod -n erp -l app=erp-ui

# Check persistent volume status (if applicable)
kubectl get pv -o wide
kubectl describe pvc -n erp
```

## 7. Emergency Procedures

### Application Rollback
```bash
# List available revisions
argocd app history erp-ui

# Rollback to specific revision
argocd app rollback erp-ui <revision-number>

# Rollback to previous revision
argocd app rollback erp-ui PREV
```

### Scale Applications
```bash
# Scale down for maintenance
kubectl scale deployment erp-ui -n erp --replicas=0

# Scale back up
kubectl scale deployment erp-ui -n erp --replicas=2

# Check current replica count
kubectl get deployment erp-ui -n erp -o jsonpath='{.spec.replicas}'
```

### Restart Applications
```bash
# Restart deployment
kubectl rollout restart deployment/erp-ui -n erp

# Check rollout status
kubectl rollout status deployment/erp-ui -n erp

# View rollout history
kubectl rollout history deployment/erp-ui -n erp
```

## 8. Monitoring and Health Checks

### Application Health
```bash
# Check application health status
kubectl get applications.argoproj.io erp-ui -n argocd -o jsonpath='{.status.health.status}'

# Get detailed health information
argocd app get erp-ui --health

# Check application conditions
kubectl get applications.argoproj.io erp-ui -n argocd -o jsonpath='{.status.conditions}'
```

### Resource Monitoring
```bash
# Monitor pod resource usage
kubectl top pods -n erp --containers

# Check node resource availability
kubectl top nodes

# Monitor persistent volume usage (if applicable)
kubectl get pv -o jsonpath='{.items[*].spec.capacity.storage}'
```

### Log Monitoring
```bash
# Stream logs for monitoring
kubectl logs -f deployment/erp-ui -n erp --tail=50

# Check for errors in logs
kubectl logs deployment/erp-ui -n erp | grep -i error

# Check for warnings in logs
kubectl logs deployment/erp-ui -n erp | grep -i warn
```

## 9. Performance Tuning

### Horizontal Pod Autoscaling
```bash
# Check HPA status
kubectl get hpa -n erp

# Describe HPA configuration
kubectl describe hpa erp-ui-hpa -n erp

# Manually scale HPA if needed
kubectl patch hpa erp-ui-hpa -n erp -p '{"spec":{"minReplicas":1}}'
```

### Resource Limits
```bash
# Check current resource limits
kubectl describe deployment erp-ui -n erp | grep -A 10 "Limits"

# Update resource limits if needed
kubectl patch deployment erp-ui -n erp -p '{"spec":{"template":{"spec":{"containers":[{"name":"erp-ui","resources":{"limits":{"cpu":"1000m","memory":"1Gi"}}}]}}}}}'
```

## 10. Security and Access Control

### Check RBAC Permissions
```bash
# Check service account permissions
kubectl get serviceaccount erp-ui -n erp -o yaml

# Check role bindings
kubectl get rolebinding -n erp
kubectl get clusterrolebinding | grep erp-ui
```

### Secret Management
```bash
# Check secret existence
kubectl get secret erp-ui-env -n erp

# View secret details (be careful with sensitive data)
kubectl describe secret erp-ui-env -n erp

# Update secrets if needed
kubectl create secret generic erp-ui-env -n erp --from-literal=API_URL="https://erpapi.masterspace.co.ke" --dry-run=client -o yaml | kubectl apply -f -
```

## 11. Frontend-Specific Operations

### Build and Deploy Process
```bash
# Manual build process (if needed)
npm run build
npm run preview

# Check build output
ls -la dist/
```

### Environment Configuration
```bash
# Check environment variables in deployment
kubectl get deployment erp-ui -n erp -o jsonpath='{.spec.template.spec.containers[0].env[*].name}'

# Update environment variables
kubectl patch deployment erp-ui -n erp -p '{"spec":{"template":{"spec":{"containers":[{"name":"erp-ui","env":[{"name":"API_URL","value":"https://erpapi.masterspace.co.ke"}]}]}}}}'
```

### Static Asset Management
```bash
# Check if static assets are served correctly
kubectl exec deployment/erp-ui -n erp -- ls -la /usr/share/nginx/html

# Check nginx configuration
kubectl exec deployment/erp-ui -n erp -- cat /etc/nginx/conf.d/default.conf
```

## 12. Integration Testing

### API Connectivity Tests
```bash
# Test API connectivity from UI pods
kubectl exec deployment/erp-ui -n erp -- curl -f https://erpapi.masterspace.co.ke/api/v1/health/

# Check API response time
kubectl exec deployment/erp-ui -n erp -- time curl -s https://erpapi.masterspace.co.ke/api/v1/health/
```

### Cross-Service Communication
```bash
# Test WebSocket connections (if applicable)
kubectl exec deployment/erp-ui -n erp -- curl -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Key: test" -H "Sec-WebSocket-Version: 13" https://erpapi.masterspace.co.ke/ws/

# Check CORS configuration
kubectl exec deployment/erp-ui -n erp -- curl -H "Origin: https://erp.masterspace.co.ke" -X OPTIONS https://erpapi.masterspace.co.ke/api/v1/health/
```

## Support and Escalation

For issues not covered in this guide:

1. **Check ArgoCD Interface**: Access ArgoCD web UI for visual application status
2. **Review Application Logs**: Check both application and ArgoCD controller logs
3. **Consult System Documentation**: Refer to `devops-k8s/docs/pipelines.md` for additional procedures
4. **Check API Status**: Verify ERP API is functioning correctly
5. **Contact Development Team**: Escalate complex issues requiring code or configuration changes

---

*This manual deployment guide is maintained alongside the automated deployment workflows. Always attempt automated deployment first, and use this guide for troubleshooting or emergency manual operations.*
