"use client"

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "@/lib/supabaseClient";
import { Search, Plus, Trash2, Save, X, Database, Upload, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as XLSX from 'xlsx';

const TABLES = [
    'machines',
    'projects',
    'users',
    'daily_logs',
    'maintenance_history',
    'maintenance_standards',
    'error_codes',
    'parts'
];

export function DatabaseEditor() {
    const [selectedTable, setSelectedTable] = useState('machines');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [editJson, setEditJson] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: res, error } = await supabase
                .from(selectedTable)
                .select('*')
                // No limit - fetch all data
                .order(selectedTable === 'users' || selectedTable === 'projects' || selectedTable === 'parts' ? 'id' : 'created_at', { ascending: false });

            if (error) throw error;
            setData(res || []);
        } catch (err: any) {
            alert('Error fetching data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        setEditingId(null);
        setEditJson('');
    }, [selectedTable]);

    const handleSave = async () => {
        try {
            let payload: any;
            try {
                payload = JSON.parse(editJson);
            } catch (e) {
                alert("Invalid JSON");
                return;
            }

            if (isCreating) {
                // Remove ID if present to let DB auto-generate, unless explicit intent
                if (payload.id === 'NEW' || payload.id === '') delete payload.id;

                const { error } = await supabase.from(selectedTable).insert(payload);
                if (error) throw error;
                setIsCreating(false);
            } else {
                if (!payload.id) {
                    alert("Record must have an ID to update");
                    return;
                }
                const { error } = await supabase.from(selectedTable).update(payload).eq('id', payload.id);
                if (error) throw error;
                setEditingId(null);
            }

            fetchData();
            alert("Saved successfully!");
        } catch (err: any) {
            alert('Save failed: ' + err.message);
        }
    };

    const handleDelete = async (id: string | number) => {
        if (window.confirm('Delete this record? This cannot be undone.')) {
            try {
                const { error } = await supabase.from(selectedTable).delete().eq('id', id);
                if (error) throw error;
                fetchData();
            } catch (err: any) {
                alert('Delete failed: ' + err.message);
            }
        }
    };

    const startEdit = (record: any) => {
        setEditingId(record.id);
        setEditJson(JSON.stringify(record, null, 2));
        setIsCreating(false);
    };

    const startCreate = () => {
        setEditingId('NEW');
        setIsCreating(true);
        // Template based on table could go here
        setEditJson('{\n  \n}');
    };

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const bstr = event.target?.result;
                const workbook = XLSX.read(bstr, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    alert('File is empty or could not be parsed.');
                    return;
                }

                if (window.confirm(`Found ${jsonData.length} records. Import into '${selectedTable}'?\n\nMake sure columns match database schema.`)) {
                    const { error } = await supabase.from(selectedTable).upsert(jsonData);
                    if (error) throw error;

                    alert(`Successfully imported/updated ${jsonData.length} records!`);
                    fetchData();
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            } catch (error: any) {
                console.error(error);
                alert('Import Failed: ' + error.message);
            }
        };
        reader.readAsBinaryString(file);
    };

    // Filter Data Client-side
    const filteredData = data.filter(item =>
        JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[700px]">
            {/* Hidden Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportExcel}
                className="hidden"
                accept=".xlsx, .xls, .csv"
            />

            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Database className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 text-sm uppercas tracking-wider">Database Editor</h2>
                        <select
                            value={selectedTable}
                            onChange={e => setSelectedTable(e.target.value)}
                            className="mt-1 px-2 py-1 border rounded text-sm bg-white font-medium outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            {TABLES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                    <div className="relative w-full sm:w-48">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search raw JSON..."
                            className="pl-9 h-9"
                        />
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={fetchData}
                        className="h-9"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                    >
                        <Upload className="w-4 h-4 mr-2" /> Import
                    </Button>
                    <Button
                        size="sm"
                        onClick={startCreate}
                        className="h-9 bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4 mr-2" /> New
                    </Button>
                </div>
            </div>

            {/* Split View */}
            <div className="flex-1 flex overflow-hidden">
                {/* List View */}
                <div className={`flex-1 overflow-auto ${editingId ? 'w-1/2 border-r border-slate-200 hidden md:block' : 'w-full'}`}>
                    <table className="w-full text-xs text-left font-mono">
                        <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-3 w-20 bg-slate-50 sticky left-0 border-r border-slate-200 z-20">Action</th>
                                {columns.slice(0, 8).map(col => (
                                    <th key={col} className="p-3 font-semibold whitespace-nowrap border-b border-slate-200">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredData.map(row => (
                                <tr key={row.id || Math.random()} className="hover:bg-blue-50/30 group">
                                    <td className="p-2 sticky left-0 bg-white group-hover:bg-blue-50/30 border-r border-slate-200 z-10">
                                        <div className="flex gap-1 justify-center">
                                            <button onClick={() => startEdit(row)} className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                                                <Save className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => handleDelete(row.id)} className="p-1 text-red-400 hover:bg-red-50 hover:text-red-600 rounded">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </td>
                                    {columns.slice(0, 8).map(col => (
                                        <td key={col} className="p-3 truncate max-w-[150px]" title={typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}>
                                            {typeof row[col] === 'object' ? 'OBJ' : String(row[col])}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr><td colSpan={10} className="p-12 text-center text-slate-400 font-sans italic">
                                    {loading ? 'Loading...' : 'No data found'}
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Editor Panel */}
                {editingId && (
                    <div className="w-full md:w-1/2 flex flex-col bg-white z-20 animate-in slide-in-from-right-10 duration-200">
                        <div className="p-3 border-b flex items-center justify-between bg-slate-50">
                            <span className="font-bold text-sm text-slate-700 font-mono">
                                {isCreating ? 'CREATE NEW RECORD' : `EDIT RECORD #${editingId}`}
                            </span>
                            <button onClick={() => setEditingId(null)} className="p-1 hover:bg-slate-200 rounded"><X className="w-4 h-4 text-slate-500" /></button>
                        </div>
                        <div className="flex-1 p-0 relative">
                            <textarea
                                value={editJson}
                                onChange={e => setEditJson(e.target.value)}
                                className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none focus:ring-inset focus:ring-2 focus:ring-blue-500/20"
                                spellCheck="false"
                                placeholder="{ ...json }"
                            />
                        </div>
                        <div className="p-4 border-t bg-slate-50 flex justify-between items-center text-xs text-slate-500">
                            <div>Be careful with ID and Foreign Keys.</div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                                <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
