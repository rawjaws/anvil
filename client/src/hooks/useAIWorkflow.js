/*
 * Copyright 2025 Darcy Davidson
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for AI Workflow management
 * Provides state management and API interactions for AI workflow operations
 */
export const useAIWorkflow = () => {
  // State management
  const [workflows, setWorkflows] = useState([]);
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // API base URL
  const API_BASE = '/api/ai-workflow';

  /**
   * Generic API call handler with error management
   */
  const apiCall = useCallback(async (url, options = {}) => {
    try {
      const response = await fetch(`${API_BASE}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API call failed: ${url}`, error);
      throw error;
    }
  }, []);

  /**
   * Fetch all workflows
   */
  const fetchWorkflows = useCallback(async () => {
    try {
      const data = await apiCall('/workflows');
      setWorkflows(data.workflows || []);
      return data.workflows;
    } catch (error) {
      setError(`Failed to fetch workflows: ${error.message}`);
      return [];
    }
  }, [apiCall]);

  /**
   * Fetch scheduled jobs
   */
  const fetchScheduledJobs = useCallback(async () => {
    try {
      const data = await apiCall('/schedule');
      setScheduledJobs(data.scheduledJobs || []);
      return data.scheduledJobs;
    } catch (error) {
      setError(`Failed to fetch scheduled jobs: ${error.message}`);
      return [];
    }
  }, [apiCall]);

  /**
   * Fetch workflow executions
   */
  const fetchExecutions = useCallback(async () => {
    try {
      // For now, we'll simulate execution data since the API doesn't have a list endpoint
      // In a real implementation, you might have a /executions endpoint
      const mockExecutions = [
        {
          id: 'exec_001',
          workflowId: 'wf_001',
          workflowName: 'Document Analysis',
          status: 'completed',
          startTime: new Date(Date.now() - 3600000).toISOString(),
          duration: '45s'
        },
        {
          id: 'exec_002',
          workflowId: 'wf_002',
          workflowName: 'Quality Assessment',
          status: 'running',
          startTime: new Date(Date.now() - 600000).toISOString(),
          duration: null
        }
      ];
      setExecutions(mockExecutions);
      return mockExecutions;
    } catch (error) {
      setError(`Failed to fetch executions: ${error.message}`);
      return [];
    }
  }, []);

  /**
   * Fetch metrics
   */
  const fetchMetrics = useCallback(async () => {
    try {
      const data = await apiCall('/metrics');
      setMetrics(data.metrics);
      return data.metrics;
    } catch (error) {
      setError(`Failed to fetch metrics: ${error.message}`);
      return null;
    }
  }, [apiCall]);

  /**
   * Refresh all data
   */
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchWorkflows(),
        fetchScheduledJobs(),
        fetchExecutions(),
        fetchMetrics()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchWorkflows, fetchScheduledJobs, fetchExecutions, fetchMetrics]);

  /**
   * Create a new workflow
   */
  const createWorkflow = useCallback(async (workflowDefinition) => {
    try {
      setLoading(true);
      const data = await apiCall('/workflows', {
        method: 'POST',
        body: JSON.stringify({ workflowDefinition })
      });

      // Refresh workflows list
      await fetchWorkflows();

      return data;
    } catch (error) {
      setError(`Failed to create workflow: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiCall, fetchWorkflows]);

  /**
   * Execute a workflow
   */
  const executeWorkflow = useCallback(async (workflowId, input = {}, context = {}) => {
    try {
      setLoading(true);
      const data = await apiCall('/execute', {
        method: 'POST',
        body: JSON.stringify({
          workflowId,
          input,
          context
        })
      });

      // Refresh executions list
      await fetchExecutions();

      return data;
    } catch (error) {
      setError(`Failed to execute workflow: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiCall, fetchExecutions]);

  /**
   * Schedule a workflow
   */
  const scheduleWorkflow = useCallback(async (scheduleConfig) => {
    try {
      setLoading(true);
      const data = await apiCall('/schedule', {
        method: 'POST',
        body: JSON.stringify(scheduleConfig)
      });

      // Refresh scheduled jobs
      await fetchScheduledJobs();

      return data;
    } catch (error) {
      setError(`Failed to schedule workflow: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiCall, fetchScheduledJobs]);

  /**
   * Cancel workflow execution
   */
  const cancelExecution = useCallback(async (executionId) => {
    try {
      const data = await apiCall(`/executions/${executionId}/cancel`, {
        method: 'POST'
      });

      // Refresh executions list
      await fetchExecutions();

      return data;
    } catch (error) {
      setError(`Failed to cancel execution: ${error.message}`);
      throw error;
    }
  }, [apiCall, fetchExecutions]);

  /**
   * Get workflow status
   */
  const getWorkflowStatus = useCallback(async (workflowId) => {
    try {
      const data = await apiCall(`/workflows/${workflowId}`);
      return data.status;
    } catch (error) {
      setError(`Failed to get workflow status: ${error.message}`);
      throw error;
    }
  }, [apiCall]);

  /**
   * Remove workflow
   */
  const removeWorkflow = useCallback(async (workflowId) => {
    try {
      await apiCall(`/workflows/${workflowId}`, {
        method: 'DELETE'
      });

      // Refresh workflows list
      await fetchWorkflows();

      return true;
    } catch (error) {
      setError(`Failed to remove workflow: ${error.message}`);
      throw error;
    }
  }, [apiCall, fetchWorkflows]);

  /**
   * Pause scheduled job
   */
  const pauseScheduledJob = useCallback(async (scheduleId) => {
    try {
      await apiCall(`/schedule/${scheduleId}/pause`, {
        method: 'POST'
      });

      // Refresh scheduled jobs
      await fetchScheduledJobs();

      return true;
    } catch (error) {
      setError(`Failed to pause scheduled job: ${error.message}`);
      throw error;
    }
  }, [apiCall, fetchScheduledJobs]);

  /**
   * Resume scheduled job
   */
  const resumeScheduledJob = useCallback(async (scheduleId) => {
    try {
      await apiCall(`/schedule/${scheduleId}/resume`, {
        method: 'POST'
      });

      // Refresh scheduled jobs
      await fetchScheduledJobs();

      return true;
    } catch (error) {
      setError(`Failed to resume scheduled job: ${error.message}`);
      throw error;
    }
  }, [apiCall, fetchScheduledJobs]);

  /**
   * Remove scheduled job
   */
  const removeScheduledJob = useCallback(async (scheduleId) => {
    try {
      await apiCall(`/schedule/${scheduleId}`, {
        method: 'DELETE'
      });

      // Refresh scheduled jobs
      await fetchScheduledJobs();

      return true;
    } catch (error) {
      setError(`Failed to remove scheduled job: ${error.message}`);
      throw error;
    }
  }, [apiCall, fetchScheduledJobs]);

  /**
   * Queue workflow for priority execution
   */
  const queueWorkflow = useCallback(async (queueItem) => {
    try {
      const data = await apiCall('/queue', {
        method: 'POST',
        body: JSON.stringify(queueItem)
      });

      return data;
    } catch (error) {
      setError(`Failed to queue workflow: ${error.message}`);
      throw error;
    }
  }, [apiCall]);

  /**
   * Get queue status
   */
  const getQueueStatus = useCallback(async () => {
    try {
      const data = await apiCall('/queue/status');
      return data.queueStatus;
    } catch (error) {
      setError(`Failed to get queue status: ${error.message}`);
      throw error;
    }
  }, [apiCall]);

  /**
   * Perform AI analysis
   */
  const performAIAnalysis = useCallback(async (content, type, options = {}) => {
    try {
      const data = await apiCall('/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({
          content,
          type,
          options
        })
      });

      return data;
    } catch (error) {
      setError(`Failed to perform AI analysis: ${error.message}`);
      throw error;
    }
  }, [apiCall]);

  /**
   * Perform smart analysis
   */
  const performSmartAnalysis = useCallback(async (content, type, documentId, options = {}) => {
    try {
      const data = await apiCall('/ai/smart-analysis', {
        method: 'POST',
        body: JSON.stringify({
          content,
          type,
          documentId,
          options
        })
      });

      return data;
    } catch (error) {
      setError(`Failed to perform smart analysis: ${error.message}`);
      throw error;
    }
  }, [apiCall]);

  /**
   * Generate AI suggestions
   */
  const generateSuggestions = useCallback(async (analysisResult, context = {}) => {
    try {
      const data = await apiCall('/ai/suggestions', {
        method: 'POST',
        body: JSON.stringify({
          analysisResult,
          context
        })
      });

      return data;
    } catch (error) {
      setError(`Failed to generate suggestions: ${error.message}`);
      throw error;
    }
  }, [apiCall]);

  /**
   * Get AI services status
   */
  const getAIServicesStatus = useCallback(async () => {
    try {
      const data = await apiCall('/ai/services');
      return data.services;
    } catch (error) {
      setError(`Failed to get AI services status: ${error.message}`);
      throw error;
    }
  }, [apiCall]);

  /**
   * Health check
   */
  const healthCheck = useCallback(async () => {
    try {
      const data = await apiCall('/health');
      return data.health;
    } catch (error) {
      setError(`Health check failed: ${error.message}`);
      throw error;
    }
  }, [apiCall]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-refresh metrics every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchMetrics();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading, fetchMetrics]);

  // Return hook interface
  return {
    // State
    workflows,
    scheduledJobs,
    executions,
    metrics,
    loading,
    error,

    // Core workflow operations
    createWorkflow,
    executeWorkflow,
    scheduleWorkflow,
    removeWorkflow,
    getWorkflowStatus,

    // Execution management
    cancelExecution,

    // Schedule management
    pauseScheduledJob,
    resumeScheduledJob,
    removeScheduledJob,

    // Queue operations
    queueWorkflow,
    getQueueStatus,

    // AI operations
    performAIAnalysis,
    performSmartAnalysis,
    generateSuggestions,
    getAIServicesStatus,

    // Data management
    refreshData,
    clearError,

    // Health and monitoring
    healthCheck,

    // Fetch functions (for manual use)
    fetchWorkflows,
    fetchScheduledJobs,
    fetchExecutions,
    fetchMetrics
  };
};