// client/src/pages/institute/components/InstituteERPHallTicketBuilder.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { hallTicketAPI } from '../../../api/hallTicket';

const HallTicketTemplateBuilder = () => {
  const [template, setTemplate] = useState({
    name: '',
    description: '',
    config: {
      layout: 'portrait',
      pageSize: 'A4',
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      styles: {
        fontFamily: 'Arial',
        primaryColor: '#1a237e',
        secondaryColor: '#0d47a1',
        accentColor: '#c62828'
      },
      sections: [
        {
          id: 'header',
          type: 'header',
          label: 'Header Section',
          enabled: true,
          order: 0,
          fields: [],
          content: 'Society for Emergency Medicine India (SEMI)'
        },
        {
          id: 'candidate',
          type: 'candidate',
          label: 'Candidate Details',
          enabled: true,
          order: 1,
          fields: [
            { id: 'candidateName', label: 'Candidate Name', type: 'text', mapping: 'candidateName' },
            { id: 'hallTicketNumber', label: 'Hall Ticket Number', type: 'text', mapping: 'hallTicketNumber' },
            { id: 'instituteName', label: 'Institute Name', type: 'text', mapping: 'instituteName' }
          ]
        }
      ]
    }
  });

  const [selectedSection, setSelectedSection] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  const handleSectionChange = (sectionId, field, value) => {
    setTemplate(prev => ({
      ...prev,
      config: {
        ...prev.config,
        sections: prev.config.sections.map(section =>
          section.id === sectionId
            ? { ...section, [field]: value }
            : section
        )
      }
    }));
  };

  const handleFieldChange = (sectionId, fieldId, field, value) => {
    setTemplate(prev => ({
      ...prev,
      config: {
        ...prev.config,
        sections: prev.config.sections.map(section =>
          section.id === sectionId
            ? {
                ...section,
                fields: section.fields.map(f =>
                  f.id === fieldId
                    ? { ...f, [field]: value }
                    : f
                )
              }
            : section
        )
      }
    }));
  };

  const addField = (sectionId) => {
    const newField = {
      id: `field-${Date.now()}`,
      label: 'New Field',
      type: 'text',
      mapping: '',
      required: false,
      styles: {
        fontSize: 12,
        fontWeight: 'normal',
        color: '#000000',
        alignment: 'left'
      }
    };
    
    setTemplate(prev => ({
      ...prev,
      config: {
        ...prev.config,
        sections: prev.config.sections.map(section =>
          section.id === sectionId
            ? { ...section, fields: [...section.fields, newField] }
            : section
        )
      }
    }));
  };

  const removeField = (sectionId, fieldId) => {
    setTemplate(prev => ({
      ...prev,
      config: {
        ...prev.config,
        sections: prev.config.sections.map(section =>
          section.id === sectionId
            ? {
                ...section,
                fields: section.fields.filter(f => f.id !== fieldId)
              }
            : section
        )
      }
    }));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(template.config.sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setTemplate(prev => ({
      ...prev,
      config: {
        ...prev.config,
        sections: updatedItems
      }
    }));
  };

  const saveTemplate = async () => {
    try {
      await hallTicketAPI.createTemplate(template);
      // Show success message
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const renderSectionEditor = () => {
    if (!selectedSection) return null;
    
    const section = template.config.sections.find(s => s.id === selectedSection);
    if (!section) return null;

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Edit Section: {section.label}</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Section Type</label>
            <select
              value={section.type}
              onChange={(e) => handleSectionChange(section.id, 'type', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="header">Header</option>
              <option value="candidate">Candidate Details</option>
              <option value="exam">Exam Details</option>
              <option value="instructions">Instructions</option>
              <option value="footer">Footer</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Section Label</label>
            <input
              type="text"
              value={section.label}
              onChange={(e) => handleSectionChange(section.id, 'label', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={section.enabled}
              onChange={(e) => handleSectionChange(section.id, 'enabled', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Enable Section</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Custom Content</label>
            <textarea
              value={section.content || ''}
              onChange={(e) => handleSectionChange(section.id, 'content', e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Fields</h4>
            <button
              onClick={() => addField(section.id)}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Add Field
            </button>
            
            <div className="mt-3 space-y-2">
              {section.fields.map((field) => (
                <div key={field.id} className="border rounded p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Field ID</label>
                        <input
                          type="text"
                          value={field.id}
                          onChange={(e) => handleFieldChange(section.id, field.id, 'id', e.target.value)}
                          className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Label</label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => handleFieldChange(section.id, field.id, 'label', e.target.value)}
                          className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Type</label>
                        <select
                          value={field.type}
                          onChange={(e) => handleFieldChange(section.id, field.id, 'type', e.target.value)}
                          className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="text">Text</option>
                          <option value="image">Image</option>
                          <option value="signature">Signature</option>
                          <option value="table">Table</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Data Mapping</label>
                        <input
                          type="text"
                          value={field.mapping}
                          onChange={(e) => handleFieldChange(section.id, field.id, 'mapping', e.target.value)}
                          placeholder="e.g., candidateName"
                          className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeField(section.id, field.id)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Hall Ticket Template Builder</h1>
          <div className="space-x-3">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              {previewMode ? 'Edit Mode' : 'Preview'}
            </button>
            <button
              onClick={saveTemplate}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Save Template
            </button>
          </div>
        </div>

        {!previewMode ? (
          <div className="grid grid-cols-12 gap-6">
            {/* Template Settings */}
            <div className="col-span-12 lg:col-span-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Template Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Template Name</label>
                    <input
                      type="text"
                      value={template.name}
                      onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={template.description}
                      onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Layout</label>
                    <select
                      value={template.config.layout}
                      onChange={(e) => setTemplate({
                        ...template,
                        config: { ...template.config, layout: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Page Size</label>
                    <select
                      value={template.config.pageSize}
                      onChange={(e) => setTemplate({
                        ...template,
                        config: { ...template.config, pageSize: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="A4">A4</option>
                      <option value="A5">A5</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Colors</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600">Primary</label>
                        <input
                          type="color"
                          value={template.config.styles.primaryColor}
                          onChange={(e) => setTemplate({
                            ...template,
                            config: {
                              ...template.config,
                              styles: { ...template.config.styles, primaryColor: e.target.value }
                            }
                          })}
                          className="mt-1 block w-full h-10 rounded-md border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600">Secondary</label>
                        <input
                          type="color"
                          value={template.config.styles.secondaryColor}
                          onChange={(e) => setTemplate({
                            ...template,
                            config: {
                              ...template.config,
                              styles: { ...template.config.styles, secondaryColor: e.target.value }
                            }
                          })}
                          className="mt-1 block w-full h-10 rounded-md border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600">Accent</label>
                        <input
                          type="color"
                          value={template.config.styles.accentColor}
                          onChange={(e) => setTemplate({
                            ...template,
                            config: {
                              ...template.config,
                              styles: { ...template.config.styles, accentColor: e.target.value }
                            }
                          })}
                          className="mt-1 block w-full h-10 rounded-md border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Builder */}
            <div className="col-span-12 lg:col-span-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Sections</h3>
                
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="sections">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        {template.config.sections
                          .sort((a, b) => a.order - b.order)
                          .map((section, index) => (
                            <Draggable key={section.id} draggableId={section.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`mb-2 p-4 border rounded-md cursor-pointer hover:border-indigo-500 ${
                                    selectedSection === section.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                                  }`}
                                  onClick={() => setSelectedSection(section.id)}
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <h4 className="font-medium">{section.label}</h4>
                                      <p className="text-sm text-gray-500">Type: {section.type}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className={`px-2 py-1 text-xs rounded-full ${
                                        section.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {section.enabled ? 'Active' : 'Disabled'}
                                      </span>
                                      <span className="text-xs text-gray-400">Order: {section.order}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>

              {/* Section Editor */}
              {renderSectionEditor()}
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow">
            <div className="max-w-3xl mx-auto">
              {/* Preview of the hall ticket */}
              <div className="border-2 border-gray-300 rounded-lg p-8 min-h-[800px]">
                <div className="text-center border-b-2 border-gray-300 pb-4">
                  <h1 className="text-2xl font-bold" style={{ color: template.config.styles.primaryColor }}>
                    Society for Emergency Medicine India (SEMI)
                  </h1>
                  <h2 className="text-xl">Hall Ticket</h2>
                </div>
                
                {/* Preview sections */}
                {template.config.sections
                  .sort((a, b) => a.order - b.order)
                  .filter(s => s.enabled)
                  .map(section => (
                    <div key={section.id} className="mt-4">
                      <h3 className="font-semibold" style={{ color: template.config.styles.secondaryColor }}>
                        {section.label}
                      </h3>
                      <div className="border p-4 mt-2 min-h-[50px] bg-gray-50">
                        <p className="text-gray-400 text-sm">Preview: {section.type} section</p>
                        {section.fields.map(field => (
                          <div key={field.id} className="flex justify-between text-sm py-1">
                            <span className="text-gray-600">{field.label}:</span>
                            <span className="text-gray-400">[{field.mapping || 'data'}]</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HallTicketTemplateBuilder;