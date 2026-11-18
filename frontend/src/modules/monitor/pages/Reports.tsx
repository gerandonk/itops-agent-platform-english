import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Download, Clock, Trash2, Edit2, Eye } from 'lucide-react';
import { message } from 'antd';
import { logger } from '@/lib/logger';
import api from '@/lib/api';
import { getAxiosErrorMessage } from '../../../lib/errorHandler';
import {
  monitorApi,
  type GeneratedReport,
  type ReportTemplate,
  type ScheduledReport,
} from '../api';
import { CreateTemplateModal, type CreateTemplateFormState } from './reports/CreateTemplateModal';
import { GenerateReportModal } from './reports/GenerateReportModal';
import { ViewReportModal } from './reports/ViewReportModal';
import { AnalyticsTab } from './reports/AnalyticsTab';

const TYPE_LABELS: Record<string, string> = {
  incident: 'Fault report',
  inspection: 'Inspection report',
  change: 'Change log',
};

const TYPE_COLORS: Record<string, string> = {
  incident: 'text-red-400 bg-red-900/30',
  inspection: 'text-blue-400 bg-blue-900/30',
  change: 'text-green-400 bg-green-900/30',
};

const TABS = [
  { key: 'templates', label: 'Report template' },
  { key: 'reports', label: 'Generated report' },
  { key: 'scheduled', label: 'Scheduled report' },
  { key: 'analytics', label: 'Data analysis' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const EMPTY_TEMPLATE_FORM: CreateTemplateFormState = {
  name: '',
  description: '',
  type: 'incident',
  content: '',
  variables: [],
};

export default function Reports() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('reports');
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [showGenerateReportModal, setShowGenerateReportModal] = useState(false);
  const [showViewReportModal, setShowViewReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [templateForm, setTemplateForm] = useState<CreateTemplateFormState>(EMPTY_TEMPLATE_FORM);

  const { data: templates } = useQuery({
    queryKey: ['reportTemplates'],
    queryFn: async () => {
      try {
        return await monitorApi.listReportTemplates();
      } catch (err: unknown) {
        message.error(`Failed to load report templates: ${getAxiosErrorMessage(err, 'Unknown error')}`);
        return [];
      }
    },
  });

  const { data: reports } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      try {
        return await monitorApi.listReports();
      } catch (err: unknown) {
        message.error(`Failed to load report list: ${getAxiosErrorMessage(err, 'Unknown error')}`);
        return [];
      }
    },
  });

  const { data: analytics } = useQuery<unknown>({
    queryKey: ['reportAnalytics'],
    queryFn: async () => monitorApi.getReportAnalytics(),
    staleTime: 120000,
  });

  const { data: scheduledReports } = useQuery({
    queryKey: ['scheduledReports'],
    queryFn: async () => {
      try {
        return await monitorApi.listScheduledReports();
      } catch (err: unknown) {
        message.error(`Failed to load scheduled reports: ${getAxiosErrorMessage(err, 'Unknown error')}`);
        return [];
      }
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (template: CreateTemplateFormState) =>
      monitorApi.createReportTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportTemplates'] });
      setShowCreateTemplateModal(false);
      setTemplateForm(EMPTY_TEMPLATE_FORM);
    },
    onError: (err: unknown) => {
      message.error(`Failed to create template: ${getAxiosErrorMessage(err, 'Unknown error')}`);
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async ({
      templateId,
      variables,
    }: {
      templateId: string;
      variables: Record<string, string>;
    }) => monitorApi.generateReport({ templateId, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setShowGenerateReportModal(false);
      setFormData({});
    },
    onError: (err: unknown) => {
      message.error(`Failed to generate report: ${getAxiosErrorMessage(err, 'Unknown error')}`);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => monitorApi.deleteReportTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportTemplates'] });
    },
    onError: (err: unknown) => {
      message.error(`Failed to delete template: ${getAxiosErrorMessage(err, 'Unknown error')}`);
    },
  });

  const handleGenerateReport = (templateId: string) => {
    const template = (templates as ReportTemplate[] | undefined)?.find((t) => t.id === templateId);
    if (!template) return;
    const initialData: Record<string, string> = {};
    template.variables?.forEach((v: string) => {
      initialData[v] = '';
    });
    setFormData(initialData);
    setSelectedTemplateId(templateId);
    setShowGenerateReportModal(true);
  };

  const handleSubmitGenerate = () => {
    generateReportMutation.mutate({
      templateId: selectedTemplateId,
      variables: formData,
    });
  };

  const handleViewReport = (report: GeneratedReport) => {
    setSelectedReport(report);
    setShowViewReportModal(true);
  };

  const handleDownloadReport = async (
    reportId: string,
    format: 'markdown' | 'pdf' | 'word' = 'markdown',
  ) => {
    try {
      const response = await api.get(`/reports/${reportId}/export?format=${format}`, {
        responseType: 'blob',
      });
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileExtension = format === 'pdf' ? 'pdf' : format === 'word' ? 'doc' : 'md';
      a.download = `report-${reportId}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      const errMsg = getAxiosErrorMessage(error, 'Download failed');
      logger.error('Download failed:', error);
      message.error(errMsg);
    }
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              Report Management
            </h1>
            <p className="text-text-secondary mt-1">Manage report templates, generate reports, and configure scheduled reports</p>
          </div>
          {activeTab === 'templates' && (
            <button
              onClick={() => setShowCreateTemplateModal(true)}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Template
            </button>
          )}
        </div>

        <div className="flex gap-2 border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'templates' && (
          <div className="grid gap-4">
            {(templates as ReportTemplate[] | undefined)?.map((template) => (
              <div key={template.id} className="bg-surface border border-border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${TYPE_COLORS[template.type] || 'text-text-secondary bg-background'}`}
                      >
                        {TYPE_LABELS[template.type] || template.type}
                      </span>
                      {template.is_preset && (
                        <span className="px-2 py-1 text-xs bg-purple-900/30 text-purple-400 rounded">
                          Presets
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-1">
                      {template.name}
                    </h3>
                    <p className="text-text-secondary text-sm mb-2">{template.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {template.variables?.map((v: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs bg-background text-text-secondary rounded"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGenerateReport(template.id)}
                      className="text-primary hover:text-primary/80 p-2"
                      title="Generate report"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    {!template.is_preset && (
                      <>
                        <button
                          className="text-text-secondary hover:text-text-primary p-2"
                          title="Edit"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteTemplateMutation.mutate(template.id)}
                          className="text-red-400 hover:text-red-300 p-2"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="grid gap-4">
            {(reports as GeneratedReport[] | undefined)?.map((report) => (
              <div key={report.id} className="bg-surface border border-border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${TYPE_COLORS[report.type] || 'text-text-secondary bg-background'}`}
                      >
                        {TYPE_LABELS[report.type] || report.type}
                      </span>
                      <span className="px-2 py-1 text-xs bg-background text-text-secondary rounded">
                        {report.format}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-1">{report.name}</h3>
                    <p className="text-text-secondary text-sm">
                      Created at:  {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewReport(report)}
                      className="text-blue-400 hover:text-blue-300 p-2"
                      title="View report"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDownloadReport(report.id, 'markdown')}
                      className="text-primary hover:text-primary/80 p-2"
                      title="Download Markdown"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDownloadReport(report.id, 'pdf')}
                      className="text-red-400 hover:text-red-300 p-2"
                      title="Download PDF"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'scheduled' && (
          <div className="grid gap-4">
            {(scheduledReports as ScheduledReport[] | undefined)?.map((report) => (
              <div key={report.id} className="bg-surface border border-border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${report.enabled ? 'text-green-400 bg-green-900/30' : 'text-text-secondary bg-background'}`}
                      >
                        {report.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <span className="px-2 py-1 text-xs bg-background text-text-secondary rounded">
                        {report.format}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-1">{report.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {report.cron_expression}
                      </span>
                      {report.last_generated && (
                        <span>Last Generated: {new Date(report.last_generated).toLocaleString()}</span>
                      )}
                      <span>Recipients: {report.recipients?.join(', ') || 'None'}</span>
                    </div>
                  </div>
                  <button className="text-primary hover:text-primary/80 p-2" title="Edit">
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'analytics' && <AnalyticsTab analytics={analytics as never} />}

        <CreateTemplateModal
          open={showCreateTemplateModal}
          form={templateForm}
          onChange={setTemplateForm}
          onClose={() => setShowCreateTemplateModal(false)}
          onSubmit={() => createTemplateMutation.mutate(templateForm)}
          submitting={createTemplateMutation.isPending}
        />

        <GenerateReportModal
          open={showGenerateReportModal}
          variables={formData}
          onChange={setFormData}
          onClose={() => setShowGenerateReportModal(false)}
          onSubmit={handleSubmitGenerate}
          submitting={generateReportMutation.isPending}
        />

        <ViewReportModal
          report={showViewReportModal ? selectedReport : null}
          typeLabels={TYPE_LABELS}
          typeColors={TYPE_COLORS}
          onClose={() => {
            setShowViewReportModal(false);
            setSelectedReport(null);
          }}
          onDownload={handleDownloadReport}
        />
      </div>
    </div>
  );
}
