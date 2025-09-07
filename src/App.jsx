import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Command, Inbox, Briefcase, Folder, Archive, Star, Calendar, Flag, User, Clock, Search, X, FileText, Link2, Menu, MoreHorizontal, CheckCircle, Circle, PlayCircle, UserCheck, ChevronDown, ArrowUp, ArrowDown, Trash2, UploadCloud, Edit, Settings, Users, LogOut } from 'lucide-react';

// --- Firebase SDK Imports ---
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, writeBatch } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";


// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyB9wrs0AuywcsVdI5qtxlgHq50ClG2bcwg",
  authDomain: "dockit-app-7067e.firebaseapp.com",
  projectId: "dockit-app-7067e",
  storageBucket: "dockit-app-7067e.appspot.com",
  messagingSenderId: "858967291692",
  appId: "1:858967291692:web:ce337c6ea7e83598d45e89"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


// --- UTILITY FUNCTIONS ---
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
    if (date.getTime() < today.getTime()) return 'Overdue';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getImportanceClass = (importance) => {
    switch (importance) {
        case 'High': return 'text-red-400 bg-red-500/10 border-red-500/30';
        case 'Medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
        case 'Low': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
        default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
};

const STATUSES = {
    'Not Started': { icon: Circle, color: 'text-gray-400' },
    'In Progress': { icon: PlayCircle, color: 'text-blue-400' },
    'Awaiting Review': { icon: UserCheck, color: 'text-purple-400' },
    'Delegated': { icon: User, color: 'text-orange-400' },
    'Complete': { icon: CheckCircle, color: 'text-green-400' },
};

// --- SUB-COMPONENTS ---

const Logo = () => {
    const [animateLogo, setAnimateLogo] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setAnimateLogo(true);
            setTimeout(() => setAnimateLogo(false), 2000); // Animation lasts 2s
        }, 60000); // Every minute
        return () => clearInterval(timer);
    }, []);

    return (
         <div className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-indigo-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7V17M4 7C4 5.34315 5.34315 4 7 4H17C18.6569 4 20 5.34315 20 7V17C20 18.6569 18.6569 20 17 20H7C5.34315 20 4 18.6569 4 17M4 7L8 7M20 7L16 7M4 17L8 17M20 17L16 17M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <h1 className="text-xl font-bold text-white font-mono" style={{ letterSpacing: '-0.05em' }}>
                <span className="inline-block transition-transform duration-500 ease-in-out" style={{ transform: animateLogo ? 'translateX(0.65em)' : 'translateX(0)' }}>
                    <span className="text-indigo-400">Do</span>
                </span>
                <span className={`inline-block transition-opacity duration-300 ${animateLogo ? 'opacity-0' : 'opacity-100'}`}>ck</span>
                <span className="inline-block transition-transform duration-500 ease-in-out" style={{ transform: animateLogo ? 'translateX(-0.65em)' : 'translateX(0)' }}>
                    <span className="text-teal-400">it</span>
                </span>
            </h1>
        </div>
    );
};

const Sidebar = ({ currentView, onSetCurrentView, isOpen, setIsOpen, onOpenImportModal, onOpenSettingsModal, onOpenProjectsModal }) => {
    const navItems = [
        { id: 'today', name: 'Today', icon: Star },
        { id: 'inbox', name: 'Processing Inbox', icon: Inbox },
        { id: 'waiting', name: 'Waiting For', icon: Clock },
    ];

    const paraItems = [
        { id: 'projects', name: 'Projects', icon: Briefcase },
        { id: 'areas', name: 'Areas', icon: Folder },
        { id: 'archives', name: 'Archives', icon: Archive },
    ];

    const handleViewChange = (view) => {
        onSetCurrentView(view);
        setIsOpen(false);
    };
    
    const handleSignOut = () => {
        signOut(auth).catch((error) => console.error("Sign out error", error));
    };

    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            ></div>
            
            <aside className={`bg-gray-900/80 backdrop-blur-sm text-gray-300 w-64 p-4 space-y-6 flex flex-col fixed inset-y-0 left-0 z-40 h-full border-r border-gray-700/50 transform transition-transform md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="px-2">
                    <Logo />
                </div>

                <nav className="flex-grow flex flex-col">
                    <div className="space-y-1">
                        {navItems.map(item => (
                            <button key={item.id} onClick={() => handleViewChange(item.id)} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === item.id ? 'bg-indigo-600/30 text-white' : 'hover:bg-gray-700/50'}`}>
                                <item.icon className="w-5 h-5" />
                                <span>{item.name}</span>
                            </button>
                        ))}
                    </div>
                    
                    <div className="mt-8">
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">PARA</h2>
                        <div className="space-y-1">
                            {paraItems.map(item => (
                                <button key={item.id} onClick={() => handleViewChange(item.id)} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === item.id ? 'bg-indigo-600/30 text-white' : 'hover:bg-gray-700/50'}`}>
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-700/50 space-y-1">
                         <button onClick={onOpenImportModal} className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-gray-700/50">
                            <UploadCloud className="w-5 h-5" />
                            <span>Import Data</span>
                        </button>
                         <button onClick={onOpenProjectsModal} className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-gray-700/50">
                            <Briefcase className="w-5 h-5" />
                            <span>Manage Projects</span>
                        </button>
                         <button onClick={onOpenSettingsModal} className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-gray-700/50">
                            <Settings className="w-5 h-5" />
                            <span>Manage Areas</span>
                        </button>
                    </div>

                    <div className="mt-auto text-xs text-gray-500 px-2">
                         <button onClick={handleSignOut} className="w-full flex items-center space-x-3 px-3 py-2 mb-2 rounded-md text-sm font-medium transition-colors hover:bg-gray-700/50 text-red-400">
                            <LogOut className="w-5 h-5" />
                            <span>Sign Out</span>
                        </button>
                        <p>Designed for Jon Boben</p>
                        <p>Version 4.0 - Final Blueprint</p>
                    </div>
                </nav>
            </aside>
        </>
    );
};

const Header = ({ onMenuClick }) => {
    return (
        <header className="md:hidden sticky top-0 bg-gray-900/70 backdrop-blur-md z-20 flex items-center justify-between p-4 border-b border-gray-700/50">
            <button onClick={onMenuClick} className="p-2 text-gray-300 -ml-2">
                <Menu className="w-6 h-6" />
            </button>
            <Logo />
            <div className="w-8"></div> {/* Spacer to balance the logo */}
        </header>
    );
};

const StatusSelector = ({ currentStatus, onStatusChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    const CurrentStatusIcon = STATUSES[currentStatus]?.icon || Circle;
    const currentColor = STATUSES[currentStatus]?.color || 'text-gray-400';

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);


    return (
        <div className="relative" ref={wrapperRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors hover:bg-gray-700 ${isOpen ? 'bg-gray-700' : ''}`}
            >
                <CurrentStatusIcon className={`w-5 h-5 ${currentColor}`} />
            </button>
            {isOpen && (
                <div className="absolute left-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
                    {Object.entries(STATUSES).map(([status, { icon: Icon, color }]) => (
                        <button 
                            key={status} 
                            onClick={() => {
                                onStatusChange(status);
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50"
                        >
                            <Icon className={`w-4 h-4 ${color}`} />
                            <span>{status}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const TaskItem = ({ task, allProjects, allContacts, onStatusChange, onTaskClick }) => {
    const parent = task.parentType === 'project' ? allProjects.find(p => p.id === task.parentId) : null;
    const parentName = parent ? `${parent.name} (#${parent.cm_number})` : 'Internal';
    const delegatedContacts = (task.delegatedToIds || []).map(id => allContacts.find(c => c.id === id)).filter(Boolean);
    const awaitingReviewContact = task.awaitingReviewFrom ? allContacts.find(c => c.id === task.awaitingReviewFrom) : null;
    
    const isComplete = task.structuredStatus === 'Complete';

    const getDelegatedText = () => {
        if (delegatedContacts.length === 0) return null;
        if (delegatedContacts.length === 1) return `Delegated: ${delegatedContacts[0].name}`;
        if (delegatedContacts.length === 2) return `Delegated: ${delegatedContacts[0].name} & ${delegatedContacts[1].name}`;
        return `Delegated: ${delegatedContacts[0].name} + ${delegatedContacts.length - 1} more`;
    };

    return (
        <div className={`flex items-start p-3 bg-gray-800/50 rounded-lg transition-colors border border-transparent group ${isComplete ? 'opacity-60' : 'hover:bg-gray-800 hover:border-gray-700'}`}>
             <div className="mt-1 flex-shrink-0">
                <StatusSelector 
                    currentStatus={task.structuredStatus} 
                    onStatusChange={(newStatus) => onStatusChange(task.id, newStatus)}
                />
            </div>
            <div className="flex-grow ml-3 cursor-pointer" onClick={() => onTaskClick(task)}>
                <p className={`text-gray-100 ${isComplete ? 'line-through text-gray-500' : ''}`}>{task.title}</p>
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs mt-1 text-gray-400">
                    {task.dueDate && (
                        <div className={`flex items-center space-x-1 ${formatDate(task.dueDate) === 'Overdue' && !isComplete ? 'text-red-400' : ''}`}>
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(task.dueDate)}</span>
                        </div>
                    )}
                    <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full border text-xs ${getImportanceClass(task.importance)}`}>
                        <Flag className="w-3 h-3" />
                        <span>{task.importance}</span>
                    </div>
                    {parent && (
                        <div className="flex items-center space-x-1">
                            <Briefcase className="w-3 h-3 text-indigo-400" />
                            <span className="truncate max-w-[200px]">{parentName}</span>
                        </div>
                    )}
                     {delegatedContacts.length > 0 && (
                        <div className="flex items-center space-x-1 text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/30">
                            <Users className="w-3 h-3" />
                            <span>{getDelegatedText()}</span>
                        </div>
                    )}
                    {awaitingReviewContact && (
                         <div className="flex items-center space-x-1 text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/30">
                            <UserCheck className="w-3 h-3" />
                            <span>Review by: {awaitingReviewContact.name}</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="text-xs text-gray-500 group-hover:opacity-100 opacity-0 transition-opacity ml-2 mt-1 shrink-0">
                {task.createdAt?.toDate().toLocaleDateString()}
            </div>
        </div>
    );
};

const QuickAddModal = ({ isOpen, onClose, onAddTask, projects, areas, initiatives }) => {
    const [mode, setMode] = useState('quick'); // 'quick' or 'detailed'
    
    // State for quick mode
    const [inputValue, setInputValue] = useState('');
    const quickInputRef = useRef(null);

    // State for detailed mode
    const [title, setTitle] = useState('');
    const [link, setLink] = useState('area_area4'); // Default to Personal area
    const [dueDate, setDueDate] = useState('');
    const [importance, setImportance] = useState('Medium');
    const detailedInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            // Reset state on open
            const defaultArea = areas.find(a => a.name === "Personal") || areas[0];
            const defaultLink = defaultArea ? `area_${defaultArea.id}` : '';
            setMode('quick');
            setInputValue('');
            setTitle('');
            setLink(defaultLink);
            setDueDate('');
            setImportance('Medium');
            setTimeout(() => {
                if (mode === 'quick') {
                    quickInputRef.current?.focus();
                } else {
                    detailedInputRef.current?.focus();
                }
            }, 100);
        }
    }, [isOpen, areas]);

    useEffect(() => {
        if (isOpen) {
            if (mode === 'quick') {
                quickInputRef.current?.focus();
            } else {
                detailedInputRef.current?.focus();
            }
        }
    }, [isOpen, mode]);


    const handleClose = () => {
        onClose();
    };
    
    const handleQuickAddKeyDown = (e) => {
        if (e.key === 'Escape') {
            handleClose();
        }
        if (e.key === 'Enter' && inputValue.trim()) {
            parseAndAddTask();
        }
    };

    const parseAndAddTask = () => {
        let text = inputValue;
        const defaultArea = areas.find(a => a.name === "Personal") || areas[0] || {id: null};
        
        const projectMatch = text.match(/#(\d{6}\.\d{4})/);
        const dueDateMatch = text.match(/due (today|tomorrow)/i);
        const importanceMatch = text.match(/p(\d)/i);

        let newTask = {
            parentType: 'area', // Default
            parentId: defaultArea.id,
            structuredStatus: 'Not Started',
            delegatedToIds: [],
            awaitingReviewFrom: null,
            associatedContacts: [],
            importance: 'Medium',
        };

        if (projectMatch) {
            const project = projects.find(p => p.cm_number === projectMatch[1]);
            if (project) {
                newTask.parentType = 'project';
                newTask.parentId = project.id;
            }
            text = text.replace(projectMatch[0], '').trim();
        }

        if (dueDateMatch) {
            const today = new Date();
            if (dueDateMatch[1].toLowerCase() === 'tomorrow') {
                today.setDate(today.getDate() + 1);
            }
            newTask.dueDate = today.toISOString().split('T')[0];
            text = text.replace(dueDateMatch[0], '').trim();
        }

        if (importanceMatch) {
            const level = parseInt(importanceMatch[1], 10);
            if (level === 1) newTask.importance = 'High';
            else if (level === 2) newTask.importance = 'Medium';
            else if (level === 3) newTask.importance = 'Low';
            text = text.replace(importanceMatch[0], '').trim();
        }
        
        newTask.title = text.trim() || "Untitled Task";
        onAddTask(newTask);
        handleClose();
    };

    const handleDetailedAddTask = () => {
        if (!title.trim()) {
            detailedInputRef.current?.focus();
            return;
        }

        const [parentType, parentId] = link.split('_');

        const newTask = {
            title: title.trim(),
            parentType,
            parentId,
            dueDate: dueDate || null,
            importance,
            structuredStatus: 'Not Started',
            delegatedToIds: [],
            awaitingReviewFrom: null,
            associatedContacts: [],
        };

        onAddTask(newTask);
        handleClose();
    };
    
    const handleDetailedKeyDown = (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleDetailedAddTask();
        }
         if (e.key === 'Escape') {
            handleClose();
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 md:pt-24 z-50" onClick={handleClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()} onKeyDown={mode === 'detailed' ? handleDetailedKeyDown : undefined}>
                <div className="p-2 flex items-center justify-between border-b border-gray-700/50">
                    <div className="flex items-center space-x-1">
                        <button onClick={() => setMode('quick')} className={`px-3 py-1 text-sm rounded-md transition-colors ${mode === 'quick' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}>
                            Quick Add
                        </button>
                        <button onClick={() => setMode('detailed')} className={`px-3 py-1 text-sm rounded-md transition-colors ${mode === 'detailed' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}>
                            Add Details
                        </button>
                    </div>
                    <button onClick={handleClose} className="p-1 rounded-md hover:bg-gray-700">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {mode === 'quick' ? (
                    <div>
                        <div className="p-4 flex items-center space-x-3">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input
                                ref={quickInputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleQuickAddKeyDown}
                                placeholder="Draft response for Acme merger docs #123456.1234 due tomorrow p1"
                                className="w-full bg-transparent text-lg text-gray-100 placeholder-gray-500 focus:outline-none"
                            />
                        </div>
                        <div className="border-t border-gray-700 px-4 py-2 text-xs text-gray-500">
                            Use <kbd className="font-sans border border-gray-600 bg-gray-900 rounded-md px-1.5 py-0.5">#C/M</kbd> for Project, <kbd className="font-sans border border-gray-600 bg-gray-900 rounded-md px-1.5 py-0.5">due ...</kbd> for Date, <kbd className="font-sans border border-gray-600 bg-gray-900 rounded-md px-1.5 py-0.5">p1-3</kbd> for Importance.
                        </div>
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <input
                                ref={detailedInputRef}
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Task Title"
                                className="w-full bg-gray-900/50 text-lg text-gray-100 placeholder-gray-500 focus:outline-none p-2 rounded-md border border-gray-700 focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="flex items-center space-x-3">
                                <Link2 className="w-5 h-5 text-gray-400" />
                                <select value={link} onChange={e => setLink(e.target.value)} className="w-full bg-gray-900/50 p-2 rounded-md border border-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <optgroup label="General">
                                        <option value={`area_${(areas.find(a => a.name === 'Personal') || {id: ''}).id}`}>Internal / Unassigned</option>
                                    </optgroup>
                                    <optgroup label="Projects">
                                        {projects.map(p => <option key={p.id} value={`project_${p.id}`}>{p.name} (#{p.cm_number})</option>)}
                                    </optgroup>
                                    <optgroup label="Client Development Initiatives">
                                        {initiatives.map(i => <option key={i.id} value={`initiative_${i.id}`}>{i.name}</option>)}
                                    </optgroup>
                                    <optgroup label="Areas">
                                        {areas.filter(a => a.name !== 'Client Development').map(a => <option key={a.id} value={`area_${a.id}`}>{a.name}</option>)}
                                    </optgroup>
                                </select>
                            </div>
                             <div className="flex items-center space-x-3">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-gray-900/50 p-2 rounded-md border border-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <Flag className="w-5 h-5 text-gray-400" />
                            <div className="flex space-x-2">
                                {['High', 'Medium', 'Low'].map(level => (
                                    <button key={level} onClick={() => setImportance(level)} className={`px-3 py-1 text-sm rounded-full border transition-colors ${importance === level ? getImportanceClass(level) + ' font-semibold' : 'text-gray-400 border-gray-700 hover:bg-gray-700/50'}`}>
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end items-center border-t border-gray-700 pt-4">
                            <span className="text-xs text-gray-500 mr-4">Press <kbd className="font-sans border border-gray-600 bg-gray-900 rounded-md px-1.5 py-0.5">⌘</kbd> + <kbd className="font-sans border border-gray-600 bg-gray-900 rounded-md px-1.5 py-0.5">Enter</kbd> to save</span>
                            <button onClick={handleDetailedAddTask} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-md flex items-center space-x-2 transition-colors">
                                <Plus className="w-4 h-4"/>
                                <span>Add Task</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ContactSelectorModal = ({ title, task, contacts, onConfirm, onCancel, onAddContact, multiSelect = false }) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState('');

    useEffect(() => {
        if (task) {
            if (multiSelect) {
                setSelectedIds(task.delegatedToIds || []);
            } else {
                setSelectedIds(task.awaitingReviewFrom ? [task.awaitingReviewFrom] : (contacts.length > 0 ? [] : []));
            }
        }
    }, [task, contacts, multiSelect]);

    if (!task) return null;

    const handleSaveNewContact = () => {
        if (newName.trim() && newRole.trim()) {
            const newContact = { name: newName.trim(), role: newRole.trim() };
            onAddContact(newContact, (newId) => {
                 if (multiSelect) {
                    setSelectedIds(prev => [...prev, newId]);
                } else {
                    setSelectedIds([newId]);
                }
            });
            setIsAdding(false);
            setNewName('');
            setNewRole('');
        }
    }

    const handleSelectionChange = (contactId) => {
        if (multiSelect) {
            setSelectedIds(prev =>
                prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
            );
        } else {
            setSelectedIds([contactId]);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 md:pt-24 z-50" onClick={onCancel}>
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <p className="text-sm text-gray-400 mt-1 truncate">"{task.title}"</p>
                </div>
                <div className="p-4">
                    {isAdding ? (
                         <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-300">Add New Contact</h4>
                            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full Name" className="w-full bg-gray-900/50 p-2 rounded-md border border-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                            <input value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="Role (e.g., Paralegal)" className="w-full bg-gray-900/50 p-2 rounded-md border border-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                             <div className="flex justify-end space-x-2 pt-2">
                                <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 transition-colors">Cancel</button>
                                <button onClick={handleSaveNewContact} className="bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-md">Save</button>
                            </div>
                        </div>
                    ) : (
                        <>
                             <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-300">Select contact(s):</label>
                                <button onClick={() => setIsAdding(true)} className="flex items-center text-sm text-indigo-400 hover:text-indigo-300 font-semibold"><Plus className="w-4 h-4 mr-1" /> New</button>
                            </div>
                            <div className="max-h-64 overflow-y-auto space-y-1 pr-2">
                                {contacts.map(contact => (
                                    <label key={contact.id} className={`flex items-center w-full p-2 rounded-md cursor-pointer transition-colors ${selectedIds.includes(contact.id) ? 'bg-indigo-600/20' : 'hover:bg-gray-700/50'}`}>
                                        <input type={multiSelect ? "checkbox" : "radio"} name="contact-selector" checked={selectedIds.includes(contact.id)} onChange={() => handleSelectionChange(contact.id)} className="w-4 h-4 bg-gray-900 border-gray-600 text-indigo-600 rounded focus:ring-indigo-500" />
                                        <span className="ml-3 text-gray-200">{contact.name}</span>
                                        <span className="ml-auto text-xs text-gray-400">{contact.role}</span>
                                    </label>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                <div className="flex justify-end items-center space-x-3 bg-gray-800/50 px-4 py-3 border-t border-gray-700 rounded-b-xl">
                    <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 transition-colors">Cancel</button>
                    <button onClick={() => onConfirm(task.id, selectedIds)} disabled={selectedIds.length === 0 || isAdding} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-md flex items-center space-x-2 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                        <UserCheck className="w-4 h-4"/>
                        <span>Confirm</span>
                    </button>
                </div>
            </div>
        </div>
    );
};


const EditTaskModal = ({ task, isOpen, onClose, onUpdate, onDelete, projects, areas, initiatives, contacts }) => {
    const [formData, setFormData] = useState(null);

    useEffect(() => {
        if (task) {
            const parentLink = `${task.parentType}_${task.parentId}`;
            setFormData({ ...task, parentLink });
        } else {
            setFormData(null);
        }
    }, [task]);

    if (!isOpen || !formData) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleLinkChange = (e) => {
        const [parentType, parentId] = e.target.value.split('_');
        setFormData(prev => ({...prev, parentType, parentId, parentLink: e.target.value}));
    };

    const handleDelegationChange = (contactId) => {
        setFormData(prev => {
            const newDelegatedToIds = (prev.delegatedToIds || []).includes(contactId)
                ? prev.delegatedToIds.filter(id => id !== contactId)
                : [...(prev.delegatedToIds || []), contactId];
            return { ...prev, delegatedToIds: newDelegatedToIds };
        });
    };

    const handleSave = () => {
        onUpdate(formData.id, formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 md:pt-24 z-50" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
                 <div className="p-4 flex items-center justify-between border-b border-gray-700/50">
                    <h3 className="text-lg font-semibold text-white">Edit Task</h3>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-700">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
                 <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <input name="title" value={formData.title} onChange={handleChange} placeholder="Task Title" className="w-full bg-gray-900/50 text-lg text-gray-100 placeholder-gray-500 focus:outline-none p-2 rounded-md border border-gray-700 focus:ring-2 focus:ring-indigo-500" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="flex items-center space-x-3">
                            <Link2 className="w-5 h-5 text-gray-400" />
                            <select value={formData.parentLink} onChange={handleLinkChange} className="w-full bg-gray-900/50 p-2 rounded-md border border-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                 <optgroup label="General"><option value={`area_${(areas.find(a => a.name === 'Personal') || {id: ''}).id}`}>Internal / Unassigned</option></optgroup>
                                 <optgroup label="Projects">{projects.map(p => <option key={p.id} value={`project_${p.id}`}>{p.name} (#{p.cm_number})</option>)}</optgroup>
                                 <optgroup label="Client Development Initiatives">{initiatives.map(i => <option key={i.id} value={`initiative_${i.id}`}>{i.name}</option>)}</optgroup>
                                 <optgroup label="Areas">{areas.filter(a => a.name !== 'Client Development').map(a => <option key={a.id} value={`area_${a.id}`}>{a.name}</option>)}</optgroup>
                            </select>
                        </div>
                         <div className="flex items-center space-x-3">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <input type="date" name="dueDate" value={formData.dueDate || ''} onChange={handleChange} className="w-full bg-gray-900/50 p-2 rounded-md border border-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <Flag className="w-5 h-5 text-gray-400" />
                        <div className="flex space-x-2">
                            {['High', 'Medium', 'Low'].map(level => (
                                <button key={level} onClick={() => setFormData(prev => ({...prev, importance: level}))} className={`px-3 py-1 text-sm rounded-full border transition-colors ${formData.importance === level ? getImportanceClass(level) + ' font-semibold' : 'text-gray-400 border-gray-700 hover:bg-gray-700/50'}`}>
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Delegated To</h4>
                        <div className="max-h-32 overflow-y-auto space-y-1 pr-2 bg-gray-900/50 p-2 rounded-md border border-gray-700">
                           {contacts.map(contact => (
                                <label key={contact.id} className={`flex items-center w-full p-2 rounded-md cursor-pointer transition-colors ${formData.delegatedToIds?.includes(contact.id) ? 'bg-indigo-600/20' : 'hover:bg-gray-700/50'}`}>
                                    <input type="checkbox" checked={formData.delegatedToIds?.includes(contact.id)} onChange={() => handleDelegationChange(contact.id)} className="w-4 h-4 bg-gray-900 border-gray-600 text-indigo-600 rounded focus:ring-indigo-500" />
                                    <span className="ml-3 text-gray-200">{contact.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center bg-gray-800/50 px-4 py-3 border-t border-gray-700 rounded-b-xl">
                    <button onClick={() => { if(window.confirm('Are you sure you want to delete this task?')) { onDelete(task.id); onClose(); }}} className="text-red-500 hover:bg-red-500/10 px-3 py-2 text-sm font-medium rounded-md flex items-center space-x-2"><Trash2 className="w-4 h-4"/><span>Delete</span></button>
                    <div className="flex items-center space-x-3">
                         <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 transition-colors">Cancel</button>
                         <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"><span>Save Changes</span></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ImportDataModal = ({ isOpen, onClose }) => {
    const [mode, setMode] = useState('paste');

    const handleProcess = () => {
        alert("This feature is not yet implemented, but this is where the processing would begin!");
        onClose();
    }
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 md:pt-24 z-50" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
                <div className="p-2 flex items-center justify-between border-b border-gray-700/50">
                    <div className="flex items-center space-x-1">
                        <button onClick={() => setMode('paste')} className={`px-3 py-1 text-sm rounded-md transition-colors ${mode === 'paste' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}>Paste Email/Text</button>
                        <button onClick={() => setMode('upload')} className={`px-3 py-1 text-sm rounded-md transition-colors ${mode === 'upload' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}>Upload File</button>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-700"><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="p-4">
                    {mode === 'paste' ? (
                        <textarea placeholder="Paste email content or notes here..." className="w-full h-64 bg-gray-900/50 p-2 rounded-md border border-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                    ) : (
                        <div className="w-full h-64 flex items-center justify-center border-2 border-dashed border-gray-600 rounded-md">
                            <input type="file" accept=".ics,.csv" className="text-gray-400"/>
                        </div>
                    )}
                </div>
                 <div className="flex justify-end items-center space-x-3 bg-gray-800/50 px-4 py-3 border-t border-gray-700 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 transition-colors">Cancel</button>
                    <button onClick={handleProcess} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-md">Process Data</button>
                </div>
            </div>
        </div>
    );
};

const SettingsModal = ({ isOpen, onClose, areas, onUpdateAreas }) => {
    const [localAreas, setLocalAreas] = useState([]);
    const [newAreaName, setNewAreaName] = useState("");

    useEffect(() => {
        if(isOpen) setLocalAreas(areas);
    }, [isOpen, areas]);

    const handleAddArea = () => {
        if (newAreaName.trim()) {
            const newArea = { name: newAreaName.trim() };
            onUpdateAreas([...localAreas, { ...newArea, id: `temp_${Date.now()}` }]);
            setNewAreaName("");
        }
    };
    
    const handleDeleteArea = (areaId) => {
        if (window.confirm("Are you sure? Deleting an area may orphan associated tasks.")) {
            onUpdateAreas(localAreas.filter(a => a.id !== areaId));
        }
    }

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 md:pt-24 z-50" onClick={onClose}>
             <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">Manage Areas</h3>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-700"><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                    {localAreas.map(area => (
                        <div key={area.id} className="flex items-center justify-between bg-gray-900/50 p-2 rounded-md">
                           <span className="text-gray-300">{area.name}</span>
                           <button onClick={() => handleDeleteArea(area.id)} className="text-red-500 hover:text-red-400 p-1"><Trash2 className="w-4 h-4"/></button>
                        </div>
                    ))}
                </div>
                 <div className="p-4 border-t border-gray-700 space-y-2">
                    <label className="text-sm font-medium text-gray-300">Add New Area</label>
                    <div className="flex space-x-2">
                        <input value={newAreaName} onChange={e => setNewAreaName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddArea()} placeholder="e.g., Health & Fitness" className="flex-grow bg-gray-900/50 p-2 rounded-md border border-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <button onClick={handleAddArea} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-md">Add</button>
                    </div>
                </div>
                <div className="flex justify-end items-center space-x-3 bg-gray-800/50 px-4 py-3 border-t border-gray-700 rounded-b-xl">
                    <button onClick={onClose} className="bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-md">Done</button>
                </div>
             </div>
        </div>
    )
}

const ManageProjectsModal = ({ isOpen, onClose, projects, onUpdateProjects }) => {
    const [localProjects, setLocalProjects] = useState([]);
    const [newClient, setNewClient] = useState('');
    const [newMatterName, setNewMatterName] = useState('');
    const [newCmNumber, setNewCmNumber] = useState('');
    const [bulkData, setBulkData] = useState('');
    const [mode, setMode] = useState('manual'); // 'manual' or 'bulk'

    useEffect(() => {
        if(isOpen) setLocalProjects(projects);
    }, [isOpen, projects]);

    const handleAddProject = () => {
        if (newClient.trim() && newMatterName.trim() && newCmNumber.trim()) {
            const newProject = {
                client: newClient.trim(),
                name: newMatterName.trim(),
                cm_number: newCmNumber.trim()
            };
            onUpdateProjects([...localProjects, { ...newProject, id: `temp_${Date.now()}` }]);
            setNewClient('');
            setNewMatterName('');
            setNewCmNumber('');
        }
    };

    const handleDeleteProject = (projectId) => {
        if (window.confirm("Are you sure? Deleting a project may orphan associated tasks.")) {
            onUpdateProjects(localProjects.filter(p => p.id !== projectId));
        }
    };

    const handleBulkImport = () => {
        const rows = bulkData.split('\n').filter(row => row.trim() !== '');
        const newProjects = rows.map(row => {
            const [client, name, cm_number] = row.split(/[\t,]/).map(item => item.trim()); // Split by tab or comma
            return { client, name, cm_number, id: `temp_bulk_${Date.now()}_${Math.random()}` };
        }).filter(p => p.client && p.name && p.cm_number);

        if (newProjects.length > 0) {
            onUpdateProjects([...localProjects, ...newProjects]);
            setBulkData('');
        } else {
            alert('Could not parse any valid projects. Please ensure data is in the format: Client, Matter Name, C/M Number');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 md:pt-24 z-50" onClick={onClose}>
             <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-3xl mx-4" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">Manage Projects (Clients/Matters)</h3>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-700"><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                 <div className="p-2 flex items-center border-b border-gray-700/50">
                    <div className="flex items-center space-x-1">
                        <button onClick={() => setMode('manual')} className={`px-3 py-1 text-sm rounded-md transition-colors ${mode === 'manual' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}>Manage List</button>
                        <button onClick={() => setMode('bulk')} className={`px-3 py-1 text-sm rounded-md transition-colors ${mode === 'bulk' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}>Bulk Import</button>
                    </div>
                </div>
                 {mode === 'manual' ? (
                     <>
                        <div className="p-4 max-h-[40vh] overflow-y-auto space-y-2">
                            {localProjects.map(project => (
                                <div key={project.id} className="grid grid-cols-12 gap-4 items-center bg-gray-900/50 p-2 rounded-md text-sm">
                                   <span className="col-span-4 text-gray-300 truncate">{project.client}</span>
                                   <span className="col-span-4 text-gray-300 truncate">{project.name}</span>
                                   <span className="col-span-3 text-gray-400 font-mono">{project.cm_number}</span>
                                   <button onClick={() => handleDeleteProject(project.id)} className="text-red-500 hover:text-red-400 p-1 justify-self-end"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            ))}
                        </div>
                         <div className="p-4 border-t border-gray-700 space-y-2">
                            <label className="text-sm font-medium text-gray-300">Add New Project</label>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <input value={newClient} onChange={e => setNewClient(e.target.value)} placeholder="Client Name" className="md:col-span-1 bg-gray-900/50 p-2 rounded-md border border-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                <input value={newMatterName} onChange={e => setNewMatterName(e.target.value)} placeholder="Matter Name" className="md:col-span-1 bg-gray-900/50 p-2 rounded-md border border-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                <input value={newCmNumber} onChange={e => setNewCmNumber(e.target.value)} placeholder="C/M Number (e.g. 123456.1234)" className="md:col-span-1 bg-gray-900/50 p-2 rounded-md border border-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                <button onClick={handleAddProject} className="md:col-span-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-md">Add</button>
                            </div>
                        </div>
                     </>
                 ) : (
                    <div className="p-4 space-y-3">
                         <p className="text-sm text-gray-400">Paste your data from a spreadsheet (CSV, TSV). Each line should contain: <code className="text-xs bg-gray-700 p-1 rounded">Client Name</code>, <code className="text-xs bg-gray-700 p-1 rounded">Matter Name</code>, <code className="text-xs bg-gray-700 p-1 rounded">C/M Number</code>.</p>
                         <textarea value={bulkData} onChange={e => setBulkData(e.target.value)} placeholder="Acme Corp, Merger Documents, 123456.1234&#10;Stark Industries, Patent Filing, 234567.2345" className="w-full h-48 bg-gray-900/50 p-2 rounded-md border border-gray-700 text-gray-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                         <div className="flex justify-end">
                            <button onClick={handleBulkImport} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-md">Import Projects</button>
                         </div>
                    </div>
                 )}
                 <div className="flex justify-end items-center space-x-3 bg-gray-800/50 px-4 py-3 border-t border-gray-700 rounded-b-xl">
                    <button onClick={onClose} className="bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-md">Done</button>
                </div>
             </div>
        </div>
    );
};


const MainContent = ({ view, tasks, projects, contacts, onStatusChange, onTaskClick, areas, initiatives }) => {
    let title = "Dashboard";
    let initialFilteredTasks = tasks;
    const today = new Date().toISOString().split('T')[0];
    const [sortConfig, setSortConfig] = useState({ key: 'dueDate', direction: 'asc' });
    const [filterQuery, setFilterQuery] = useState('');

    switch (view) {
        case 'today':
            title = 'Today';
            initialFilteredTasks = tasks.filter(t => t.structuredStatus !== 'Complete' && (t.dueDate === today || new Date(t.dueDate) < new Date(today)));
            break;
        case 'inbox':
            title = 'Processing Inbox';
            initialFilteredTasks = tasks.filter(t => t.structuredStatus === 'Not Started' && !t.dueDate);
            break;
        case 'waiting':
             title = 'Waiting For';
             initialFilteredTasks = tasks.filter(t => t.structuredStatus === 'Delegated' || t.structuredStatus === 'Awaiting Review');
             break;
        case 'projects':
            title = 'All Projects';
            initialFilteredTasks = tasks.filter(t => t.parentType === 'project');
            break;
        case 'areas':
            title = 'All Areas';
            initialFilteredTasks = tasks.filter(t => t.parentType === 'area' || t.parentType === 'initiative');
            break;
        case 'archives':
             title = 'Archives';
             initialFilteredTasks = tasks.filter(t => t.structuredStatus === 'Complete');
             break;
        default:
            title = 'Today';
            initialFilteredTasks = tasks.filter(t => t.structuredStatus !== 'Complete' && (t.dueDate === today || new Date(t.dueDate) < new Date(today)));
    }

    // Filtering Logic
    const filteredTasks = initialFilteredTasks.filter(task => 
        task.title.toLowerCase().includes(filterQuery.toLowerCase())
    );
    
    // Sorting Logic
    const importanceOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
    const sortedTasks = [...filteredTasks].sort((a, b) => {
        let aValue, bValue;

        if (sortConfig.key === 'importance') {
            aValue = importanceOrder[a.importance];
            bValue = importanceOrder[b.importance];
        } else if (sortConfig.key === 'createdAt' || sortConfig.key === 'dueDate') {
            const aDate = a[sortConfig.key];
            const bDate = b[sortConfig.key];
            aValue = aDate ? (aDate.toDate ? aDate.toDate().getTime() : new Date(aDate).getTime()) : 0;
            bValue = bDate ? (bDate.toDate ? bDate.toDate().getTime() : new Date(bDate).getTime()) : 0;
            if (!aValue) return 1;
            if (!bValue) return -1;
        } else {
            return 0;
        }
        
        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortButton = ({ sortKey, children }) => (
        <button
            onClick={() => handleSort(sortKey)}
            className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md transition-colors ${sortConfig.key === sortKey ? 'bg-indigo-600/30 text-white' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'}`}
        >
            <span>{children}</span>
            {sortConfig.key === sortKey && (
                sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
            )}
        </button>
    );

    // Grouping logic for specific views
    const groupedByProject = view === 'projects' ? sortedTasks.reduce((acc, task) => {
        const project = projects.find(p => p.id === task.parentId);
        const key = project ? `${project.client} - ${project.name}` : 'Unassigned';
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
    }, {}) : null;

    const groupedByArea = view === 'areas' ? sortedTasks.reduce((acc, task) => {
        const key = task.parentType === 'area' ? areas.find(a=>a.id === task.parentId)?.name : initiatives.find(i=>i.id === task.parentId)?.name;
        if (!key) return acc;
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
    }, {}) : null;
    
    // Split tasks for 'Today' view
    const overdueTasks = view === 'today' ? sortedTasks.filter(t => new Date(t.dueDate) < new Date(today) && t.structuredStatus !== 'Complete') : [];
    const todayTasks = view === 'today' ? sortedTasks.filter(t => t.dueDate === today && t.structuredStatus !== 'Complete') : [];
    
    const renderTaskItem = (task) => (
        <TaskItem key={task.id} task={task} allProjects={projects} allContacts={contacts} onStatusChange={onStatusChange} onTaskClick={onTaskClick} />
    )

    return (
        <main className="flex-1 p-4 md:p-8 md:ml-64">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-white hidden md:block shrink-0">{title}</h1>
                <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-end gap-2">
                    <div className="relative w-full md:w-auto">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Filter tasks..."
                            value={filterQuery}
                            onChange={(e) => setFilterQuery(e.target.value)}
                            className="w-full md:w-48 bg-gray-800/50 text-sm text-gray-300 rounded-md py-2 pl-9 pr-3 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                         <SortButton sortKey="dueDate">Due Date</SortButton>
                         <SortButton sortKey="importance">Importance</SortButton>
                         <SortButton sortKey="createdAt">Created</SortButton>
                    </div>
                </div>
            </div>
            
            {view === 'today' ? (
                <div className="space-y-8">
                    {overdueTasks.length > 0 && (
                        <div>
                            <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">Overdue</h2>
                            <div className="space-y-2">{overdueTasks.map(renderTaskItem)}</div>
                        </div>
                    )}
                    {todayTasks.length > 0 && (
                        <div>
                            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Due Today</h2>
                            <div className="space-y-2">{todayTasks.map(renderTaskItem)}</div>
                        </div>
                    )}
                     {todayTasks.length === 0 && overdueTasks.length === 0 && filterQuery === '' && (
                         <div className="text-center py-16 text-gray-500"><Inbox className="w-12 h-12 mx-auto mb-4" /><p>All clear for today!</p></div>
                     )}
                </div>
            ) : groupedByProject ? (
                <div className="space-y-6">
                    {Object.entries(groupedByProject).map(([groupName, tasks]) => (
                        <div key={groupName}>
                            <h2 className="text-md font-semibold text-indigo-400 mb-3">{groupName}</h2>
                            <div className="space-y-2">{tasks.map(renderTaskItem)}</div>
                        </div>
                    ))}
                </div>
            ) : groupedByArea ? (
                 <div className="space-y-6">
                    {Object.entries(groupedByArea).map(([groupName, tasks]) => (
                        <div key={groupName}>
                            <h2 className="text-md font-semibold text-teal-400 mb-3">{groupName}</h2>
                            <div className="space-y-2">{tasks.map(renderTaskItem)}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {sortedTasks.length > 0 ? (
                        sortedTasks.map(renderTaskItem)
                    ) : (
                        <div className="text-center py-16 text-gray-500">
                            <Search className="w-12 h-12 mx-auto mb-4" />
                            <p>No tasks found.</p>
                             {filterQuery && <p className="text-sm">Try clearing your filter.</p>}
                        </div>
                    )}
                </div>
            )}
        </main>
    );
};

const DockitApp = () => {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [areas, setAreas] = useState([]);
    const [initiatives, setInitiatives] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [currentView, setCurrentView] = useState('today');
    const [userId, setUserId] = useState(null);
    
    // Modal states
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
    
    // State for modals with context
    const [taskToDelegate, setTaskToDelegate] = useState(null);
    const [taskAwaitingReview, setTaskAwaitingReview] = useState(null);
    const [taskToEdit, setTaskToEdit] = useState(null);
    const [isMac, setIsMac] = useState(false);
    
    // --- Set the current user from auth state ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
                setUserId(user.uid);
            } else {
                setUserId(null);
            }
        });
        return () => unsubscribe();
    }, []);


const useCollection = (collectionName) => {
    const [data, setData] = useState([]);
    useEffect(() => {
        if (!userId) {
            setData([]);
            return;
        };
        const q = query(collection(db, "users", userId, collectionName));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // --- NEW DIAGNOSTIC ALERT ---
            if (collectionName === 'tasks') {
                alert(`Data received from Firestore: ${items.length} task(s).`);
            }

            setData(items);
        });
        return () => unsubscribe();
    }, [userId, collectionName]);
    return data;
};

    const tasksData = useCollection('tasks');
    const projectsData = useCollection('projects');
    const areasData = useCollection('areas');
    const initiativesData = useCollection('initiatives');
    const contactsData = useCollection('contacts');

    useEffect(() => setTasks(tasksData), [tasksData]);
    useEffect(() => setProjects(projectsData), [projectsData]);
    useEffect(() => setAreas(areasData), [areasData]);
    useEffect(() => setInitiatives(initiativesData), [initiativesData]);
    useEffect(() => setContacts(contactsData), [contactsData]);


    const handleOpenQuickAdd = useCallback(() => setIsQuickAddOpen(true), []);

    useEffect(() => {
        setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                handleOpenQuickAdd();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleOpenQuickAdd]);

const handleAddTask = async (newTaskData) => {
    if(!userId) return;
    try {
        await addDoc(collection(db, "users", userId, 'tasks'), {
            ...newTaskData,
            createdAt: serverTimestamp(),
        });
    } catch(e) { console.error("Error adding task: ", e); }
};
    
    const handleUpdateTask = async (taskId, updatedData) => {
        if(!userId) return;
        const taskRef = doc(db, "users", userId, "tasks", taskId);
        // Remove id and parentLink before sending to Firestore
        const { id, parentLink, ...dataToUpdate } = updatedData;
        try {
            await updateDoc(taskRef, dataToUpdate);
        } catch (e) { console.error("Error updating task: ", e)}
    };

    const handleDeleteTask = async (taskId) => {
        if(!userId) return;
        try {
            await deleteDoc(doc(db, "users", userId, "tasks", taskId));
        } catch(e) { console.error("Error deleting task: ", e)}
    };

    const handleAddNewContact = async (newContactData, callback) => {
        if(!userId) return;
        try {
            const docRef = await addDoc(collection(db, "users", userId, 'contacts'), newContactData);
            if (callback) callback(docRef.id);
        } catch(e) { console.error("Error adding contact: ", e)}
    };

    const handleStatusChange = (taskId, newStatus) => {
        const task = tasks.find(t => t.id === taskId);
        if (newStatus === 'Delegated') {
            setTaskToDelegate(task);
        } else if (newStatus === 'Awaiting Review') {
            setTaskAwaitingReview(task);
        }
        else {
            handleUpdateTask(taskId, {
                structuredStatus: newStatus,
                completedAt: newStatus === 'Complete' ? new Date().toISOString() : null,
                delegatedToIds: newStatus !== 'Delegated' ? [] : task.delegatedToIds,
                awaitingReviewFrom: newStatus !== 'Awaiting Review' ? null : task.awaitingReviewFrom,
            });
        }
    };
    
    const handleConfirmDelegation = (taskId, contactIds) => {
        handleUpdateTask(taskId, { structuredStatus: 'Delegated', delegatedToIds: contactIds, awaitingReviewFrom: null, completedAt: null });
        setTaskToDelegate(null);
    };

    const handleConfirmAwaitingReview = (taskId, contactIds) => {
        handleUpdateTask(taskId, { structuredStatus: 'Awaiting Review', awaitingReviewFrom: contactIds[0] || null, delegatedToIds: [], completedAt: null });
        setTaskAwaitingReview(null);
    };
    
    const handleBatchUpdate = async (collectionName, currentItems, newItems) => {
        if (!userId) return;
        const batch = writeBatch(db);
        
        // Delete items that are not in the new list
        currentItems.forEach(item => {
            if (!newItems.find(newItem => newItem.id === item.id)) {
                batch.delete(doc(db, "users", userId, collectionName, item.id));
            }
        });

        // Add or update items
        newItems.forEach(item => {
            if (item.id.startsWith('temp_')) { // New items
                const { id, ...itemData } = item;
                batch.set(doc(collection(db, "users", userId, collectionName)), itemData);
            }
        });

        try {
            await batch.commit();
        } catch(e) {
            console.error(`Error updating ${collectionName}: `, e);
        }
    };
    
    const handleUpdateAreas = (newAreas) => handleBatchUpdate('areas', areas, newAreas);
    const handleUpdateProjects = (newProjects) => handleBatchUpdate('projects', projects, newProjects);


    const handleTaskClick = (task) => {
        setTaskToEdit(task);
        setIsEditModalOpen(true);
    };

    return (
        <div className="bg-gray-900 min-h-screen text-gray-200 font-sans antialiased">
            <div className="relative flex min-h-screen">
                <Sidebar 
                    currentView={currentView} 
                    onSetCurrentView={setCurrentView}
                    isOpen={isSidebarOpen}
                    setIsOpen={setIsSidebarOpen}
                    onOpenImportModal={() => setIsImportModalOpen(true)}
                    onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
                    onOpenProjectsModal={() => setIsProjectsModalOpen(true)}
                />
                <div className="flex-1 flex flex-col">
                    <Header 
                        onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <MainContent 
                        view={currentView} 
                        tasks={tasks} 
                        projects={projects} 
                        contacts={contacts}
                        areas={areas}
                        initiatives={initiatives}
                        onStatusChange={handleStatusChange}
                        onTaskClick={handleTaskClick}
                    />
                </div>
                <QuickAddModal 
                    isOpen={isQuickAddOpen} 
                    onClose={() => setIsQuickAddOpen(false)} 
                    onAddTask={handleAddTask}
                    projects={projects}
                    areas={areas}
                    initiatives={initiatives}
                />
                <ContactSelectorModal 
                    title="Delegate Task"
                    task={taskToDelegate}
                    contacts={contacts}
                    onConfirm={handleConfirmDelegation}
                    onCancel={() => setTaskToDelegate(null)}
                    onAddContact={handleAddNewContact}
                    multiSelect={true}
                />
                <ContactSelectorModal 
                    title="Awaiting Review From"
                    task={taskAwaitingReview}
                    contacts={contacts}
                    onConfirm={handleConfirmAwaitingReview}
                    onCancel={() => setTaskAwaitingReview(null)}
                    onAddContact={handleAddNewContact}
                    multiSelect={false}
                />
                <EditTaskModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    task={taskToEdit}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                    projects={projects}
                    areas={areas}
                    initiatives={initiatives}
                    contacts={contacts}
                />
                <ImportDataModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                />
                 <SettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    areas={areas}
                    onUpdateAreas={handleUpdateAreas}
                />
                <ManageProjectsModal
                    isOpen={isProjectsModalOpen}
                    onClose={() => setIsProjectsModalOpen(false)}
                    projects={projects}
                    onUpdateProjects={handleUpdateProjects}
                />
            </div>

            {/* Floating Action Button for Quick Add */}
            <button
                onClick={handleOpenQuickAdd}
                className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 z-20"
                aria-label="Quick Add Task"
            >
                <Plus className="w-6 h-6" />
            </button>
            <div className="hidden md:block fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-800/80 backdrop-blur-sm text-gray-400 text-sm px-4 py-2 rounded-full border border-gray-700 shadow-lg">
                Press <kbd className="font-sans border border-gray-600 bg-gray-900 rounded-md px-1.5 py-0.5">{isMac ? '⌘' : 'Ctrl'}</kbd> + <kbd className="font-sans border border-gray-600 bg-gray-900 rounded-md px-1.5 py-0.5">K</kbd> to add a task
            </div>
        </div>
    );
};

const LoginScreen = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // onLogin is not a prop, login state is handled by onAuthStateChanged
            })
            .catch((error) => {
                setError("Failed to sign in. Please check your email and password.");
                console.error("Login Error:", error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <div className="bg-gray-900 min-h-screen flex items-center justify-center font-sans antialiased text-gray-200">
            <div className="w-full max-w-sm mx-auto p-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
                <div className="flex justify-center mb-6">
                    <Logo />
                </div>
                <h2 className="text-2xl font-bold text-center text-white mb-6">Sign In</h2>
                <form onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <input 
                            type="email" 
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-900/50 p-3 rounded-md border border-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input 
                            type="password" 
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-900/50 p-3 rounded-md border border-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-md transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}


export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="bg-gray-900 min-h-screen flex items-center justify-center">
                <div className="animate-pulse"><Logo /></div>
            </div>
        );
    }

    return user ? <DockitApp /> : <LoginScreen />;
}

