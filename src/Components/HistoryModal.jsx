import React, { useState } from 'react';
import { X, History, RotateCcw, Package, Clock, Calendar, Trash2, ChevronDown, ChevronRight, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { message, Tag, Popconfirm } from 'antd';
import { deleteHistory } from '../api/api';

const STATUS_LABELS = {
    0: 'Unpaid',
    1: 'Paid',
};

const STATUS_COLORS = {
    0: 'text-orange-500',
    1: 'text-green-500',
};

const ACTION_COLORS = {
    created: 'bg-blue-100 text-blue-700',
    updated: 'bg-yellow-100 text-yellow-800',
    payment_initiation: 'bg-purple-100 text-purple-700',
    payment_received: 'bg-green-100 text-green-700',
};

const HistoryModal = ({ isOpen, onClose, history, onRevert, onHistoryUpdated }) => {
    const [expandedId, setExpandedId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const ITEM_PRICES = {
        'T-SHIRT': 200, 'SWEATSHIRT': 350, 'HOODIE': 450,
        'ZIPPERHOODIE': 500, 'SWEATPANTS': 300, 'SHORTS': 250,
    };
    const getItemPrice = (type) => ITEM_PRICES[type?.toUpperCase()] || 0;

    if (!isOpen) return null;

    const handleDelete = async (id) => {
        setDeletingId(id);
        try {
            await deleteHistory(id);
            message.success('History entry deleted.');
            onHistoryUpdated?.();
        } catch (err) {
            message.error(err?.response?.data?.message || 'Failed to delete history.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white relative shrink-0">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                    <div className="flex justify-between items-start relative z-10">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                                <History className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">Order Revision History</h2>
                                <p className="text-slate-400 text-sm mt-1">{history.length} saved version{history.length !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center">
                                <Package className="w-10 h-10 text-slate-200" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-400">No revisions yet</h3>
                                <p className="text-slate-400 max-w-xs mt-2">Save your design to start tracking versions.</p>
                            </div>
                        </div>
                    ) : (
                        history.map((version, index) => {
                            const isExpanded = expandedId === version.id;
                            const items = version.order?.order_items || version.changes?.previousItems || [];
                            const actionColor = ACTION_COLORS[version.action] || 'bg-slate-100 text-slate-700';

                            return (
                                <div key={version.id}
                                    className="group bg-slate-50 hover:bg-white rounded-3xl border border-slate-100 hover:border-green-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
                                >
                                    {/* Card Header */}
                                    <div className="p-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                <div className="w-1.5 h-10 rounded-full bg-slate-200 group-hover:bg-green-500 transition-colors shrink-0" />
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="px-2.5 py-1 bg-slate-800 text-white text-[10px] font-bold rounded-full uppercase tracking-widest">
                                                            V{version.version}
                                                        </span>
                                                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest ${actionColor}`}>
                                                            {version.action?.replace(/_/g, ' ')}
                                                        </span>
                                                        {index === 0 && (
                                                            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-widest border border-green-200">
                                                                Latest
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-2 text-slate-500 text-xs">
                                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(version.created_at).toLocaleDateString()}</span>
                                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(version.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span className="flex items-center gap-1"><Package className="w-3 h-3" />{items.length} item{items.length !== 1 ? 's' : ''}</span>
                                                    </div>
                                                    {version.changes_summary && (
                                                        <p className="text-xs text-slate-400 mt-1 truncate">{version.changes_summary}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 ml-3">
                                                <button
                                                    onClick={() => setExpandedId(isExpanded ? null : version.id)}
                                                    className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-500"
                                                    title="View details"
                                                >
                                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => { onRevert(version); onClose(); }}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all text-xs font-bold"
                                                    title="Restore this version"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                    Restore
                                                </button>
                                                <Popconfirm
                                                    title="Delete this history entry?"
                                                    description="This cannot be undone."
                                                    onConfirm={() => handleDelete(version.id)}
                                                    okText="Delete"
                                                    cancelText="Cancel"
                                                    okButtonProps={{ danger: true }}
                                                >
                                                    <button
                                                        disabled={deletingId === version.id}
                                                        className="p-2 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-xl transition-all"
                                                        title="Delete this entry"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </Popconfirm>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded: Item Details */}
                                    {isExpanded && items.length > 0 && (
                                        <div className="px-6 pb-5 border-t border-slate-100">
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-4 mb-3">Order Items</p>
                                            <div className="space-y-2">
                                                {items.map((item, i) => {
                                                    const isPaymentAction = version.action === 'payment_received' || version.action === 'payment_initiation';
                                                    return (
                                                        <div key={i} className="flex items-center justify-between bg-white rounded-2xl p-3 border border-slate-100">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
                                                                    <Package className="w-4 h-4 text-slate-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-800">{item.product_type}</p>
                                                                    <p className="text-xs text-slate-400">
                                                                        {item.selectedColor && <span className="mr-2">🎨 {item.selectedColor}</span>}
                                                                        {item.selectedSize && <span>📏 {item.selectedSize}</span>}
                                                                        <span className="font-medium text-slate-600 ml-2">({getItemPrice(item.product_type)} DKK)</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {isPaymentAction && (
                                                                    item.status === 1 ? (
                                                                        <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
                                                                            <CheckCircle className="w-3.5 h-3.5" />Paid
                                                                        </span>
                                                                    ) : (
                                                                        <span className="flex items-center gap-1 text-orange-500 text-xs font-bold">
                                                                            <AlertCircle className="w-3.5 h-3.5" />Unpaid
                                                                        </span>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Payment Summary from changes */}
                                            {version.changes?.previousTotal != null && (
                                                <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2 text-sm">
                                                    <CreditCard className="w-4 h-4 text-slate-500" />
                                                    <span className="text-slate-500">Order total at this version:</span>
                                                    <span className="font-bold text-slate-800">{version.changes.previousTotal} DKK</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
                    <div className="flex items-start space-x-3 text-slate-500 text-xs leading-relaxed">
                        <div className="p-1 bg-amber-50 rounded-lg text-amber-600 mt-0.5 shrink-0">
                            <RotateCcw className="w-3 h-3" />
                        </div>
                        <p>
                            Restoring a version loads its configuration into the editor. You can undo this immediately using the Undo button.
                            Deleted history entries are hidden but not permanently removed.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;
