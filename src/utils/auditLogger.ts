interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  changes?: Record<string, { old: any; new: any }>;
  timestamp: Date;
  ipAddress?: string;
}

class AuditLogger {
  private logs: AuditLog[] = [];

  log(
    userId: string,
    userName: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT',
    entity: string,
    entityId: string,
    changes?: Record<string, { old: any; new: any }>
  ) {
    const auditLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      userName,
      action,
      entity,
      entityId,
      changes,
      timestamp: new Date(),
      ipAddress: 'localhost' // In production, get real IP
    };

    this.logs.push(auditLog);
    
    // Store in localStorage for persistence (in production, send to backend)
    const existingLogs = JSON.parse(localStorage.getItem('audit-logs') || '[]');
    existingLogs.push(auditLog);
    
    // Keep only last 1000 logs
    if (existingLogs.length > 1000) {
      existingLogs.splice(0, existingLogs.length - 1000);
    }
    
    localStorage.setItem('audit-logs', JSON.stringify(existingLogs));
    
    console.log(`[AUDIT] ${userName} ${action} ${entity} ${entityId}`, changes);
  }

  getLogs(filters?: {
    userId?: string;
    entity?: string;
    action?: string;
    fromDate?: Date;
    toDate?: Date;
  }): AuditLog[] {
    const allLogs = JSON.parse(localStorage.getItem('audit-logs') || '[]');
    
    if (!filters) return allLogs;

    return allLogs.filter((log: AuditLog) => {
      if (filters.userId && log.userId !== filters.userId) return false;
      if (filters.entity && log.entity !== filters.entity) return false;
      if (filters.action && log.action !== filters.action) return false;
      if (filters.fromDate && new Date(log.timestamp) < filters.fromDate) return false;
      if (filters.toDate && new Date(log.timestamp) > filters.toDate) return false;
      return true;
    });
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem('audit-logs');
  }
}

export const auditLogger = new AuditLogger();

// Helper function to track changes
export const trackChanges = (oldData: any, newData: any): Record<string, { old: any; new: any }> => {
  const changes: Record<string, { old: any; new: any }> = {};
  
  Object.keys(newData).forEach(key => {
    if (oldData[key] !== newData[key]) {
      changes[key] = {
        old: oldData[key],
        new: newData[key]
      };
    }
  });
  
  return changes;
};
