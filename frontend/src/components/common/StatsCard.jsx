import React from 'react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

export default function StatsCard({ title, value, icon: Icon, description, trend, className, iconColor = 'text-red-600 bg-red-50 border-red-100' }) {
  return (
    <Card className={cn('relative overflow-hidden border border-slate-200/80 bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">{title}</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-slate-500 line-clamp-1">{description}</p>
            )}
            {trend !== undefined && (
              <div className="flex items-center gap-1 pt-1">
                <span
                  className={cn(
                    'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold',
                    trend >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  )}
                >
                  {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
                </span>
                <span className="text-[11px] text-slate-400">vs last month</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-xs', iconColor)}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
