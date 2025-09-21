import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { FileText, Plus, ArrowLeft, ChevronDown, ChevronRight, Settings, Box, Zap, Activity, BarChart3, ShoppingCart, Bot, Search, Shield, Layers } from 'lucide-react'
import './Sidebar.css'

export default function Sidebar() {
  const {
    capabilities,
    enablers,
    selectedCapability,
    setSelectedCapability,
    selectedDocument,
    setSelectedDocument,
    navigationHistory,
    goBack,
    clearHistory,
    loading
  } = useApp()
  
  const [expandedSections, setExpandedSections] = useState({
    capabilities: true,
    enablers: true,
    templates: true,
    tools: true,
    features: true
  })
  
  const navigate = useNavigate()

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleCapabilityClick = (capability) => {
    setSelectedCapability(capability)
    setSelectedDocument({ 
      type: 'capability', 
      path: capability.path, 
      id: capability.id || capability.title || capability.path
    })
    clearHistory()
    navigate(`/view/capability/${capability.path}`)
  }

  const handleEnablerClick = (enabler) => {
    setSelectedDocument({ 
      type: 'enabler', 
      path: enabler.path, 
      id: enabler.id || enabler.title || enabler.path
    })
    navigate(`/view/enabler/${enabler.path}`)
  }


  const handleCreateCapability = () => {
    // Clear selected document when creating new
    setSelectedDocument(null)
    navigate('/create/capability')
  }

  const handleCreateEnabler = () => {
    // Clear selected document when creating new
    setSelectedDocument(null)
    navigate('/create/enabler')
  }

  const handleBackClick = () => {
    goBack()
  }

  // Filter enablers based on selected capability
  const filteredEnablers = selectedCapability
    ? enablers.filter(enabler => enabler.capabilityId === selectedCapability.id)
    : enablers

  // Group capabilities by system|component structure
  const groupCapabilitiesBySystemComponent = (capabilities) => {
    const groups = {}

    capabilities.forEach(capability => {
      // Use system and component metadata fields
      const system = capability.system?.trim()
      const component = capability.component?.trim()

      if (system && component) {
        // Create group key using metadata fields
        const groupKey = `${system} | ${component}`

        if (!groups[groupKey]) {
          groups[groupKey] = []
        }
        groups[groupKey].push(capability)
      } else {
        // Add to unassigned group if system or component is missing
        if (!groups['Unassigned']) {
          groups['Unassigned'] = []
        }
        groups['Unassigned'].push(capability)
      }
    })

    return groups
  }

  const capabilityGroups = groupCapabilitiesBySystemComponent(capabilities)

  // Find the capability associated with the currently selected enabler
  const getAssociatedCapabilityId = () => {
    if (selectedDocument?.type === 'enabler') {
      const selectedEnabler = enablers.find(enabler => enabler.path === selectedDocument.path)
      return selectedEnabler?.capabilityId
    }
    return null
  }

  const associatedCapabilityId = getAssociatedCapabilityId()

  if (loading) {
    return (
      <div className="sidebar">
        <div className="sidebar-loading">
          <div className="spinner"></div>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="sidebar">
      {navigationHistory.length > 0 && (
        <button onClick={handleBackClick} className="back-button">
          <ArrowLeft size={16} />
          Back
        </button>
      )}

      <div className="sidebar-section">
        <div 
          className="sidebar-section-header"
          onClick={() => toggleSection('capabilities')}
        >
          {expandedSections.capabilities ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span>Capabilities</span>
          <button 
            onClick={(e) => {
              e.stopPropagation()
              handleCreateCapability()
            }}
            className="btn btn-sm btn-primary"
          >
            <Plus size={14} />
          </button>
        </div>
        
        {expandedSections.capabilities && (
          <div className="sidebar-items">
            {Object.entries(capabilityGroups)
              .sort(([a], [b]) => {
                // Sort "Unassigned" to the bottom
                if (a === 'Unassigned') return 1
                if (b === 'Unassigned') return -1
                return a.localeCompare(b)
              })
              .map(([groupKey, groupCapabilities]) => (
                <div key={groupKey} className="capability-group">
                  <div className="sidebar-item capability-item group-header">
                    <Box size={16} />
                    <span>{groupKey}</span>
                  </div>
                  <div className="capability-group-items">
                    {groupCapabilities.map((capability) => {
                      const isActive = selectedDocument?.type === 'capability' && selectedDocument?.path === capability.path
                      const isAssociated = associatedCapabilityId && capability.id === associatedCapabilityId

                      return (
                        <div
                          key={capability.path}
                          className={`sidebar-item capability-item ${isActive ? 'active' : ''} ${isAssociated ? 'associated' : ''} ${capability.status === 'Implemented' ? 'implemented' : ''}`}
                          onClick={() => handleCapabilityClick(capability)}
                        >
                          <Zap size={16} className={capability.status === 'Implemented' ? 'implemented-icon' : ''} />
                          <span>{capability.title || capability.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="sidebar-section">
        <div
          className="sidebar-section-header"
          onClick={() => toggleSection('enablers')}
        >
          {expandedSections.enablers ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span>Enablers</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleCreateEnabler()
            }}
            className="btn btn-sm btn-primary"
          >
            <Plus size={14} />
          </button>
        </div>
        
        {expandedSections.enablers && (
          <div className="sidebar-items">
            {filteredEnablers.map((enabler) => (
              <div
                key={enabler.path}
                className={`sidebar-item ${selectedDocument?.type === 'enabler' && selectedDocument?.path === enabler.path ? 'active' : ''} ${selectedCapability ? 'indented' : ''} ${enabler.status === 'Implemented' ? 'implemented' : ''}`}
                onClick={() => handleEnablerClick(enabler)}
              >
                <Zap size={16} className={enabler.status === 'Implemented' ? 'implemented-icon' : ''} />
                <span>{enabler.title || enabler.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sidebar-section">
        <div
          className="sidebar-section-header"
          onClick={() => toggleSection('templates')}
        >
          {expandedSections.templates ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span>Templates</span>
        </div>
        
        {expandedSections.templates && (
          <div className="sidebar-items">
            {templates.map((template) => (
              <div 
                key={template.path}
                className={`sidebar-item ${selectedDocument?.type === 'template' && selectedDocument?.path === template.path ? 'active' : ''}`}
                onClick={() => handleTemplateClick(template)}
              >
                <Settings size={16} />
                <span>{template.title || template.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Tools Section */}
      <div className="sidebar-section">
        <div
          className="sidebar-section-header"
          onClick={() => toggleSection('tools')}
        >
          {expandedSections.tools ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span>The Blacksmith's Arsenal</span>
        </div>

        {expandedSections.tools && (
          <div className="sidebar-items">
            <div
              className="sidebar-item"
              onClick={() => navigate('/validation')}
            >
              <Shield size={16} />
              <span>Sir Lancelot's Blade</span>
            </div>
            <div
              className="sidebar-item"
              onClick={() => navigate('/analytics')}
            >
              <BarChart3 size={16} />
              <span>Morgana's Crystal Ball</span>
            </div>
            <div
              className="sidebar-item"
              onClick={() => navigate('/agents')}
            >
              <Bot size={16} />
              <span>Knights of the Round Table</span>
            </div>
            <div
              className="sidebar-item"
              onClick={() => navigate('/discovery')}
            >
              <Search size={16} />
              <span>Sir Percival's Quest</span>
            </div>
          </div>
        )}
      </div>

      {/* Marketplace Section */}
      <div className="sidebar-section">
        <div
          className="sidebar-section-header"
          onClick={() => toggleSection('features')}
        >
          {expandedSections.features ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span>Camelot's Library</span>
        </div>

        {expandedSections.features && (
          <div className="sidebar-items">
            <div
              className="sidebar-item"
              onClick={() => navigate('/marketplace')}
            >
              <ShoppingCart size={16} />
              <span>Browse Scrolls</span>
            </div>
            <div
              className="sidebar-item"
              onClick={() => navigate('/marketplace/generate')}
            >
              <Activity size={16} />
              <span>Forge New Scroll</span>
            </div>
            <div
              className="sidebar-item"
              onClick={() => navigate('/marketplace/community')}
            >
              <Layers size={16} />
              <span>Royal Court</span>
            </div>
            <div
              className="sidebar-item"
              onClick={() => navigate('/features')}
            >
              <Settings size={16} />
              <span>Feature Management</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}