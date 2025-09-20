/**
 * Template Editor Component
 * Advanced template editing and customization interface
 */

import React, { useState, useEffect, useRef } from 'react';
import './TemplateEditor.css';

const TemplateEditor = ({ initialTemplate = null, onSave, onCancel }) => {
    const [template, setTemplate] = useState({
        name: '',
        description: '',
        content: '',
        type: 'capability',
        category: 'general',
        industry: 'general',
        complexity: 'medium',
        tags: []
    });
    const [activeTab, setActiveTab] = useState('editor');
    const [validation, setValidation] = useState(null);
    const [saving, setSaving] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [editorHistory, setEditorHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const textareaRef = useRef(null);

    // Initialize template data
    useEffect(() => {
        if (initialTemplate) {
            setTemplate(initialTemplate);
            setEditorHistory([initialTemplate.content]);
            setHistoryIndex(0);
        } else {
            const defaultContent = generateDefaultTemplate();
            setTemplate(prev => ({ ...prev, content: defaultContent }));
            setEditorHistory([defaultContent]);
            setHistoryIndex(0);
        }
    }, [initialTemplate]);

    const generateDefaultTemplate = () => {
        return `# [Template Name]

## Metadata
- **Name**: [Template Name]
- **Type**: ${template.type === 'capability' ? 'Capability' : 'Enabler'}
- **ID**: ${template.type === 'capability' ? 'CAP' : 'ENB'}-XXXXXX
- **Status**: In Draft
- **Approval**: Not Approved
- **Priority**: Medium
- **Analysis Review**: Required
- **Owner**: Product Team
- **Created Date**: ${new Date().toISOString().split('T')[0]}
- **Last Updated**: ${new Date().toISOString().split('T')[0]}
- **Version**: 1.0

## Technical Overview
### Purpose
[Describe the purpose and objectives of this ${template.type}]

${template.type === 'capability' ? `
## Enablers
List of enablers that implement this capability:

| Enabler ID | Name | Description | Status | Approval | Priority |
|------------|------|-------------|--------|----------|----------|
| ENB-XXXXX1 | [Enabler Name] | [Description] | In Draft | Not Approved | High |

## Dependencies
### Internal Upstream Dependency
| Capability ID | Name | Description |
|---------------|------|-------------|
| CAP-XXXXX | [Dependency Name] | [Description] |

### Internal Downstream Impact
| Capability ID | Name | Description |
|---------------|------|-------------|
| CAP-XXXXX | [Impact Name] | [Description] |
` : `
## Functional Requirements

| ID | Name | Requirement | Priority | Status | Approval |
|----|------|-------------|----------|--------|----------|
| FR-001 | [Requirement Name] | [Description] | High | In Draft | Not Approved |

## Non-Functional Requirements

| ID | Name | Type | Requirement | Priority | Status | Approval |
|----|------|------|-------------|----------|--------|----------|
| NFR-001 | [Requirement Name] | Performance | [Description] | High | In Draft | Not Approved |
`}

## Technical Specifications
[Technical implementation details]

# Development Plan
[Development planning sections]
`;
    };

    const handleTemplateChange = (field, value) => {
        setTemplate(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleContentChange = (e) => {
        const content = e.target.value;
        handleTemplateChange('content', content);

        // Add to history for undo/redo
        if (content !== editorHistory[historyIndex]) {
            const newHistory = editorHistory.slice(0, historyIndex + 1);
            newHistory.push(content);
            setEditorHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
    };

    const addTag = () => {
        if (newTag.trim() && !template.tags.includes(newTag.trim())) {
            handleTemplateChange('tags', [...template.tags, newTag.trim()]);
            setNewTag('');
        }
    };

    const removeTag = (tagToRemove) => {
        handleTemplateChange('tags', template.tags.filter(tag => tag !== tagToRemove));
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            e.preventDefault();
            addTag();
        }
    };

    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            handleTemplateChange('content', editorHistory[newIndex]);
        }
    };

    const redo = () => {
        if (historyIndex < editorHistory.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            handleTemplateChange('content', editorHistory[newIndex]);
        }
    };

    const insertTemplate = (templateType) => {
        const cursor = textareaRef.current.selectionStart;
        const content = template.content;
        let insertion = '';

        switch (templateType) {
            case 'table':
                insertion = `
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
`;
                break;
            case 'mermaid':
                insertion = `
\`\`\`mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action]
    B -->|No| D[Alternative]
    C --> E[End]
    D --> E
\`\`\`
`;
                break;
            case 'requirement':
                insertion = `
| REQ-XXX | [Requirement Name] | [Description] | High | In Draft | Not Approved |
`;
                break;
            case 'section':
                insertion = `
## New Section
[Section content]
`;
                break;
        }

        const newContent = content.slice(0, cursor) + insertion + content.slice(cursor);
        handleTemplateChange('content', newContent);

        // Focus and position cursor
        setTimeout(() => {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(
                cursor + insertion.length,
                cursor + insertion.length
            );
        }, 10);
    };

    const validateTemplate = async () => {
        try {
            const response = await fetch('/api/marketplace/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(template)
            });

            const result = await response.json();
            setValidation(result.data);
            return result.data.isValid;
        } catch (error) {
            setValidation({
                isValid: false,
                errors: ['Failed to validate template'],
                warnings: []
            });
            return false;
        }
    };

    const saveTemplate = async () => {
        setSaving(true);
        try {
            const isValid = await validateTemplate();
            if (!isValid) {
                setSaving(false);
                return;
            }

            if (onSave) {
                await onSave(template);
            }
        } catch (error) {
            console.error('Failed to save template:', error);
        } finally {
            setSaving(false);
        }
    };

    const renderEditor = () => (
        <div className="editor-section">
            <div className="editor-toolbar">
                <div className="toolbar-group">
                    <button
                        onClick={() => insertTemplate('section')}
                        className="toolbar-btn"
                        title="Add Section"
                    >
                        📝 Section
                    </button>
                    <button
                        onClick={() => insertTemplate('table')}
                        className="toolbar-btn"
                        title="Insert Table"
                    >
                        📊 Table
                    </button>
                    <button
                        onClick={() => insertTemplate('mermaid')}
                        className="toolbar-btn"
                        title="Insert Diagram"
                    >
                        📈 Diagram
                    </button>
                    <button
                        onClick={() => insertTemplate('requirement')}
                        className="toolbar-btn"
                        title="Add Requirement"
                    >
                        📋 Requirement
                    </button>
                </div>

                <div className="toolbar-group">
                    <button
                        onClick={undo}
                        disabled={historyIndex <= 0}
                        className="toolbar-btn"
                        title="Undo"
                    >
                        ↶ Undo
                    </button>
                    <button
                        onClick={redo}
                        disabled={historyIndex >= editorHistory.length - 1}
                        className="toolbar-btn"
                        title="Redo"
                    >
                        ↷ Redo
                    </button>
                </div>

                <div className="toolbar-group">
                    <button
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        className={`toolbar-btn ${isPreviewMode ? 'active' : ''}`}
                        title="Toggle Preview"
                    >
                        👁️ Preview
                    </button>
                </div>
            </div>

            <div className="editor-content">
                {isPreviewMode ? (
                    <div className="preview-pane">
                        <div
                            className="markdown-preview"
                            dangerouslySetInnerHTML={{
                                __html: markdownToHtml(template.content)
                            }}
                        />
                    </div>
                ) : (
                    <textarea
                        ref={textareaRef}
                        value={template.content}
                        onChange={handleContentChange}
                        className="content-editor"
                        placeholder="Start writing your template content..."
                        spellCheck={false}
                    />
                )}
            </div>
        </div>
    );

    const renderMetadata = () => (
        <div className="metadata-section">
            <h3>Template Metadata</h3>

            <div className="form-row">
                <div className="form-group">
                    <label>Template Name</label>
                    <input
                        type="text"
                        value={template.name}
                        onChange={(e) => handleTemplateChange('name', e.target.value)}
                        className="form-input"
                        placeholder="Enter template name"
                    />
                </div>

                <div className="form-group">
                    <label>Type</label>
                    <select
                        value={template.type}
                        onChange={(e) => handleTemplateChange('type', e.target.value)}
                        className="form-select"
                    >
                        <option value="capability">Capability</option>
                        <option value="enabler">Enabler</option>
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label>Description</label>
                <textarea
                    value={template.description}
                    onChange={(e) => handleTemplateChange('description', e.target.value)}
                    className="form-textarea"
                    rows={3}
                    placeholder="Describe what this template is for"
                />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Category</label>
                    <select
                        value={template.category}
                        onChange={(e) => handleTemplateChange('category', e.target.value)}
                        className="form-select"
                    >
                        <option value="general">General</option>
                        <option value="api">API Services</option>
                        <option value="data">Data & Analytics</option>
                        <option value="security">Security & Privacy</option>
                        <option value="user">User Management</option>
                        <option value="integration">System Integration</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Industry</label>
                    <select
                        value={template.industry}
                        onChange={(e) => handleTemplateChange('industry', e.target.value)}
                        className="form-select"
                    >
                        <option value="general">General</option>
                        <option value="automotive">Automotive</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="fintech">Financial Technology</option>
                        <option value="e-commerce">E-Commerce</option>
                        <option value="iot">Internet of Things</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Complexity</label>
                    <select
                        value={template.complexity}
                        onChange={(e) => handleTemplateChange('complexity', e.target.value)}
                        className="form-select"
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label>Tags</label>
                <div className="tags-input">
                    <div className="tags-list">
                        {template.tags.map(tag => (
                            <span key={tag} className="tag">
                                {tag}
                                <button
                                    onClick={() => removeTag(tag)}
                                    className="tag-remove"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Add a tag and press Enter"
                        className="tag-input"
                    />
                </div>
            </div>
        </div>
    );

    const renderValidation = () => (
        <div className="validation-section">
            <h3>Template Validation</h3>

            {validation ? (
                <div className={`validation-result ${validation.isValid ? 'valid' : 'invalid'}`}>
                    <div className="validation-header">
                        <span className="validation-icon">
                            {validation.isValid ? '✅' : '❌'}
                        </span>
                        <span className="validation-status">
                            {validation.isValid ? 'Template is valid' : 'Template has issues'}
                        </span>
                        <span className="validation-score">
                            Score: {validation.score}/100
                        </span>
                    </div>

                    {validation.errors && validation.errors.length > 0 && (
                        <div className="validation-errors">
                            <h4>Errors that must be fixed:</h4>
                            <ul>
                                {validation.errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {validation.warnings && validation.warnings.length > 0 && (
                        <div className="validation-warnings">
                            <h4>Warnings to consider:</h4>
                            <ul>
                                {validation.warnings.map((warning, index) => (
                                    <li key={index}>{warning}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {validation.isValid && (
                        <div className="validation-success">
                            <p>🎉 Your template is ready for use!</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="validation-prompt">
                    <p>Click "Validate Template" to check your template for issues.</p>
                    <button onClick={validateTemplate} className="btn-secondary">
                        Validate Template
                    </button>
                </div>
            )}
        </div>
    );

    // Simple markdown to HTML converter for preview
    const markdownToHtml = (markdown) => {
        let html = markdown
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/^\- (.*$)/gim, '<li>$1</li>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/\n/gim, '<br>');

        // Wrap consecutive <li> tags in <ul>
        html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

        // Basic table support
        html = html.replace(/\|(.+)\|/g, (match, content) => {
            if (content.includes('---')) {
                return ''; // Skip separator rows
            }
            const cells = content.split('|').map(cell => cell.trim()).filter(cell => cell);
            return '<tr>' + cells.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
        });

        html = html.replace(/(<tr>.*<\/tr>)/gs, '<table>$1</table>');

        return html;
    };

    const tabs = [
        { id: 'editor', label: 'Editor', icon: '✏️' },
        { id: 'metadata', label: 'Metadata', icon: '📝' },
        { id: 'validation', label: 'Validation', icon: '✅' }
    ];

    return (
        <div className="template-editor">
            <div className="editor-header">
                <h2>{initialTemplate ? 'Edit Template' : 'Create New Template'}</h2>
                <div className="editor-actions">
                    <button onClick={onCancel} className="btn-outline">
                        Cancel
                    </button>
                    <button
                        onClick={saveTemplate}
                        disabled={saving || !template.name.trim()}
                        className="btn-primary"
                    >
                        {saving ? 'Saving...' : 'Save Template'}
                    </button>
                </div>
            </div>

            <div className="editor-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="editor-body">
                {activeTab === 'editor' && renderEditor()}
                {activeTab === 'metadata' && renderMetadata()}
                {activeTab === 'validation' && renderValidation()}
            </div>
        </div>
    );
};

export default TemplateEditor;