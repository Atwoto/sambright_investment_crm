import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from './card';
import { Shield } from 'lucide-react';

export function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md animate-enter">
        <CardHeader className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
