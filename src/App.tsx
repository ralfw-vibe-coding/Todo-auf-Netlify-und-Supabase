import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import {
  Check,
  CheckCheck,
  CircleUserRound,
  List,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Plus,
  RotateCcw,
  Tags,
  Trash2,
  X,
} from 'lucide-react';

import './App.css';
import { ClientProcessor } from './client/processor';
import { getSupabaseClient } from './client/supabase';
import type { ListView, QueryTasksInput, TaskStatus, TaskView, TaskViewMode } from './shared/api';

interface AuthFormState {
  email: string;
  password: string;
  passwordConfirm: string;
  username: string;
}

interface EditTaskState {
  taskId: string;
  title: string;
  description: string;
  dueDate: string;
  listId: string;
  status: TaskStatus;
  originalStatus: TaskStatus;
  tags: string[];
}

type ListFilter = 'all' | string;

interface AccountFormState {
  username: string;
  password: string;
  passwordConfirm: string;
}

interface PasswordResetRequestState {
  email: string;
}

interface PasswordResetState {
  password: string;
  passwordConfirm: string;
}

function App() {
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState<AuthFormState>({
    email: '',
    password: '',
    passwordConfirm: '',
    username: '',
  });
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const [lists, setLists] = useState<ListView[]>([]);
  const [listFilter, setListFilter] = useState<ListFilter>('all');
  const [newListName, setNewListName] = useState('');
  const [showListsPanel, setShowListsPanel] = useState(true);
  const [showTagsPanel, setShowTagsPanel] = useState(true);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [revealedListActionsId, setRevealedListActionsId] = useState<string | null>(null);
  const listHoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [taskMode, setTaskMode] = useState<TaskViewMode>('active');
  const [searchText, setSearchText] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [activeStatusFilters, setActiveStatusFilters] = useState<TaskStatus[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editTask, setEditTask] = useState<EditTaskState | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [draggedListId, setDraggedListId] = useState<string | null>(null);
  const [dragOverListId, setDragOverListId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState<AccountFormState>({
    username: '',
    password: '',
    passwordConfirm: '',
  });
  const [showResetRequestModal, setShowResetRequestModal] = useState(false);
  const [resetRequestForm, setResetRequestForm] = useState<PasswordResetRequestState>({
    email: '',
  });
  const [resetRequestMessage, setResetRequestMessage] = useState<string | null>(null);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [passwordResetForm, setPasswordResetForm] = useState<PasswordResetState>({
    password: '',
    passwordConfirm: '',
  });
  const [passwordResetMessage, setPasswordResetMessage] = useState<string | null>(null);

  const supabase = useMemo(() => {
    try {
      return getSupabaseClient();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Supabase config invalid.';
      setSupabaseError(message);
      return null;
    }
  }, []);

  const processor = useMemo(() => {
    if (!supabase) {
      return null;
    }

    return new ClientProcessor(async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session?.access_token) {
        throw new Error('No active session.');
      }

      return data.session.access_token;
    });
  }, [supabase]);

  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setAuthMessage(null);

      if (event === 'PASSWORD_RECOVERY') {
        setPasswordResetForm({ password: '', passwordConfirm: '' });
        setPasswordResetMessage(null);
        setShowPasswordResetModal(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 980px)');

    const applyLayoutMode = (matches: boolean) => {
      setIsCompactLayout(matches);
      if (matches) {
        setShowListsPanel(false);
        setShowTagsPanel(false);
      } else {
        setShowListsPanel(true);
        setShowTagsPanel(true);
      }
    };

    applyLayoutMode(mediaQuery.matches);
    const listener = (event: MediaQueryListEvent) => applyLayoutMode(event.matches);
    mediaQuery.addEventListener('change', listener);

    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  useEffect(
    () => () => {
      if (listHoverTimer.current) clearTimeout(listHoverTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!showUserMenu) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [showUserMenu]);

  useEffect(() => {
    if (!session || !processor) {
      setTasks([]);
      setLists([]);
      return;
    }

    void refreshLists(processor, setLists, setAuthMessage);
  }, [session, processor]);

  useEffect(() => {
    if (!session || !processor) {
      setTasks([]);
      return;
    }

    void loadTasks(
      processor,
      buildTaskQueryInput(taskMode, searchText, activeTagFilter, activeStatusFilters, listFilter),
      setTasks,
      setAuthMessage,
    );
  }, [session, processor, taskMode, searchText, activeTagFilter, activeStatusFilters, listFilter]);

  const onLogin = async () => {
    if (!supabase) return;

    setBusy(true);
    setAuthMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: authForm.email,
      password: authForm.password,
    });
    setBusy(false);

    if (error) {
      setAuthMessage(error.message);
    }
  };

  const onSignup = async () => {
    if (!supabase) return;

    if (authForm.password !== authForm.passwordConfirm) {
      setAuthMessage('Passwörter stimmen nicht überein.');
      return;
    }

    const passwordError = validatePassword(authForm.password);
    if (passwordError) {
      setAuthMessage(passwordError);
      return;
    }

    setBusy(true);
    setAuthMessage(null);

    const { error } = await supabase.auth.signUp({
      email: authForm.email,
      password: authForm.password,
      options: {
        emailRedirectTo: getAuthEmailRedirectUrl(),
        data: {
          username: authForm.username,
        },
      },
    });

    setBusy(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthMessage('Signup erfolgreich. Bitte bestätige deine E-Mail über den Link in der Mail.');
    setAuthMode('login');
  };

  const onLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const onOpenResetRequest = () => {
    setResetRequestForm({ email: authForm.email.trim() });
    setResetRequestMessage(null);
    setShowResetRequestModal(true);
  };

  const onSendPasswordResetEmail = async () => {
    if (!supabase) return;

    const email = resetRequestForm.email.trim();
    if (!email) {
      setResetRequestMessage('E-Mail ist erforderlich.');
      return;
    }

    setBusy(true);
    setResetRequestMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthEmailRedirectUrl(),
      });

      if (error) {
        setResetRequestMessage(error.message);
        return;
      }

      setShowResetRequestModal(false);
      setAuthMessage('Reset-Link wurde per E-Mail gesendet.');
    } finally {
      setBusy(false);
    }
  };

  const onSaveNewPassword = async () => {
    if (!supabase) return;

    if (passwordResetForm.password !== passwordResetForm.passwordConfirm) {
      setPasswordResetMessage('Passwörter stimmen nicht überein.');
      return;
    }

    const passwordError = validatePassword(passwordResetForm.password);
    if (passwordError) {
      setPasswordResetMessage(passwordError);
      return;
    }

    setBusy(true);
    setPasswordResetMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordResetForm.password,
      });

      if (error) {
        setPasswordResetMessage(error.message);
        return;
      }

      setShowPasswordResetModal(false);
      setPasswordResetForm({ password: '', passwordConfirm: '' });
      setAuthMode('login');
      setAuthMessage('Passwort aktualisiert. Du kannst dich jetzt einloggen.');
      window.history.replaceState({}, document.title, window.location.pathname);
      await supabase.auth.signOut();
    } finally {
      setBusy(false);
    }
  };

  const onOpenAccount = () => {
    const username = (user?.user_metadata.username as string | undefined) ?? '';
    setAccountForm({
      username,
      password: '',
      passwordConfirm: '',
    });
    setAccountMessage(null);
    setShowAccountModal(true);
  };

  const onSaveAccount = async () => {
    if (!supabase || !user) return;

    const username = accountForm.username.trim();
    if (!username) {
      setAccountMessage('Username ist erforderlich.');
      return;
    }

    if (accountForm.password || accountForm.passwordConfirm) {
      if (accountForm.password !== accountForm.passwordConfirm) {
        setAccountMessage('Passwörter stimmen nicht überein.');
        return;
      }

      const passwordError = validatePassword(accountForm.password);
      if (passwordError) {
        setAccountMessage(passwordError);
        return;
      }
    }

    setBusy(true);
    setAccountMessage(null);

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { username },
        password: accountForm.password || undefined,
      });

      if (error) {
        setAccountMessage(error.message);
        return;
      }

      setUser(data.user ?? user);
      setAccountMessage(null);
      setShowAccountModal(false);
    } finally {
      setBusy(false);
    }
  };

  const onCreateTask = async () => {
    if (!processor) return;
    const title = newTaskTitle.trim();
    if (!title) {
      setAuthMessage('Titel ist erforderlich.');
      return;
    }

    const selectedListId = listFilter !== 'all' ? listFilter : undefined;

    setBusy(true);
    setAuthMessage(null);

    try {
      await processor.createTask({ title, listId: selectedListId });
      setNewTaskTitle('');
      await refreshTasks(processor, taskMode, searchText, activeTagFilter, activeStatusFilters, listFilter, setTasks, setAuthMessage);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Task konnte nicht erstellt werden.');
    } finally {
      setBusy(false);
    }
  };

  const onToggleDone = async (task: TaskView) => {
    if (!processor) return;

    const nextStatus = task.status === 'Done' ? 'In Progress' : 'Done';

    setBusy(true);
    setAuthMessage(null);

    try {
      await processor.setTaskStatus(task.taskId, nextStatus);
      await refreshTasks(processor, taskMode, searchText, activeTagFilter, activeStatusFilters, listFilter, setTasks, setAuthMessage);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Status konnte nicht geändert werden.');
    } finally {
      setBusy(false);
    }
  };

  const onDeleteTask = async (taskId: string) => {
    if (!processor) return;

    setBusy(true);
    setAuthMessage(null);

    try {
      await processor.deleteTask(taskId);
      await refreshTasks(processor, taskMode, searchText, activeTagFilter, activeStatusFilters, listFilter, setTasks, setAuthMessage);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Task konnte nicht gelöscht werden.');
    } finally {
      setBusy(false);
    }
  };

  const onMoveTaskToList = async (taskId: string, listId: string) => {
    if (!processor) return;
    const task = tasks.find((item) => item.taskId === taskId);
    if (!task || task.listId === listId) return;

    setBusy(true);
    setAuthMessage(null);

    try {
      await processor.updateTask(taskId, { listId });
      await refreshTasks(processor, taskMode, searchText, activeTagFilter, activeStatusFilters, listFilter, setTasks, setAuthMessage);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Aufgabe konnte nicht verschoben werden.');
    } finally {
      setBusy(false);
      setDraggedTaskId(null);
      setDraggedListId(null);
      setDragOverListId(null);
      setDragOverTaskId(null);
    }
  };

  const onStartEditTask = (task: TaskView) => {
    setEditTask({
      taskId: task.taskId,
      title: task.title,
      description: task.description ?? '',
      dueDate: task.dueDate ?? '',
      listId: task.listId ?? '__without__',
      status: task.status,
      originalStatus: task.status,
      tags: task.tags,
    });
  };

  const onSaveEditTask = async () => {
    if (!processor || !editTask) return;

    setBusy(true);
    setAuthMessage(null);

    try {
      await processor.updateTask(editTask.taskId, {
        title: editTask.title,
        description: editTask.description,
        dueDate: editTask.dueDate,
        listId: editTask.listId,
        tags: editTask.tags,
      });
      if (editTask.status !== editTask.originalStatus) {
        await processor.setTaskStatus(editTask.taskId, editTask.status);
      }
      setEditTask(null);
      await refreshTasks(processor, taskMode, searchText, activeTagFilter, activeStatusFilters, listFilter, setTasks, setAuthMessage);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Task konnte nicht aktualisiert werden.');
    } finally {
      setBusy(false);
    }
  };

  const onCreateList = async () => {
    if (!processor) return;
    const name = newListName.trim();
    if (!name) return;

    setBusy(true);
    setAuthMessage(null);

    try {
      await processor.createList(name);
      setNewListName('');
      await refreshLists(processor, setLists, setAuthMessage);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Liste konnte nicht erstellt werden.');
    } finally {
      setBusy(false);
    }
  };

  const onRenameList = async (list: ListView) => {
    if (!processor || list.isDefault) return;

    const nextName = window.prompt('Neuer Listenname', list.name)?.trim();
    if (!nextName || nextName === list.name) return;

    setBusy(true);
    setAuthMessage(null);

    try {
      await processor.renameList(list.listId, nextName);
      await refreshLists(processor, setLists, setAuthMessage);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Liste konnte nicht umbenannt werden.');
    } finally {
      setBusy(false);
    }
  };

  const onDeleteList = async (list: ListView) => {
    if (!processor || list.isDefault) return;
    if (!window.confirm(`Liste '${list.name}' löschen? Aufgaben bleiben erhalten und sind danach ohne Liste.`)) return;

    setBusy(true);
    setAuthMessage(null);

    try {
      await processor.deleteList(list.listId);
      if (listFilter === list.listId) {
        setListFilter('all');
      }
      await refreshLists(processor, setLists, setAuthMessage);
      await refreshTasks(processor, taskMode, searchText, activeTagFilter, activeStatusFilters, 'all', setTasks, setAuthMessage);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Liste konnte nicht gelöscht werden.');
    } finally {
      setBusy(false);
    }
  };

  if (supabaseError) {
    return (
      <main className="layout">
        <section className="panel">
          <h1>Everlist</h1>
          <p className="error">{supabaseError}</p>
        </section>
      </main>
    );
  }

  if (!session || !user) {
    return (
      <main className="layout">
        <div className="auth-layout">
          <section className="panel auth-panel">
            <h1>Everlist</h1>

            <div className="tabs">
              <button className={authMode === 'login' ? 'tab active' : 'tab'} onClick={() => setAuthMode('login')} type="button">
                Login
              </button>
              <button className={authMode === 'signup' ? 'tab active' : 'tab'} onClick={() => setAuthMode('signup')} type="button">
                Signup
              </button>
            </div>

            <label>
              E-Mail
              <input
                type="email"
                value={authForm.email}
                onChange={(event) => setAuthForm((state) => ({ ...state, email: event.target.value }))}
              />
            </label>

            {authMode === 'signup' && (
              <label>
                Username
                <input
                  type="text"
                  value={authForm.username}
                  onChange={(event) => setAuthForm((state) => ({ ...state, username: event.target.value }))}
                />
              </label>
            )}

            <label>
              Passwort
              <input
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm((state) => ({ ...state, password: event.target.value }))}
              />
            </label>

            {authMode === 'signup' && (
              <label>
                Passwort wiederholen
                <input
                  type="password"
                  value={authForm.passwordConfirm}
                  onChange={(event) => setAuthForm((state) => ({ ...state, passwordConfirm: event.target.value }))}
                />
              </label>
            )}

            <button type="button" disabled={busy} onClick={authMode === 'login' ? onLogin : onSignup}>
              {busy ? '...' : authMode === 'login' ? 'Login' : 'Signup'}
            </button>
            {authMode === 'login' && (
              <button type="button" className="link-btn" onClick={onOpenResetRequest} disabled={busy}>
                Passwort vergessen?
              </button>
            )}

            {authMessage && <p className="hint">{authMessage}</p>}
          </section>

          <section className="panel landing-panel">
            <h2>Everlist</h2>
            <p className="landing-claim">Wo sich Aufgaben versammeln, um erledigt zu werden.</p>
            <p className="landing-copy">
              Everlist hilft dir, den Überblick zu behalten: klare Listen, fokussierte Status und schnelle Bearbeitung ohne
              unnötigen Ballast.
            </p>
            <p className="landing-copy">
              Aufgaben landen dort, wo sie hingehören, lassen sich per Drag&amp;Drop verschieben und bleiben durch Tags
              sofort auffindbar.
            </p>
            <p className="landing-copy">
              Kurz gesagt: weniger Suchen, weniger Reibung, mehr erledigen.
            </p>
          </section>
        </div>
        {showResetRequestModal && (
          <div className="modal-backdrop" onClick={() => setShowResetRequestModal(false)}>
            <section className="modal-panel" onClick={(event) => event.stopPropagation()}>
              <h3>Passwort zurücksetzen</h3>
              <p className="hint">Du bekommst einen Link per E-Mail von Supabase.</p>
              <label>
                E-Mail
                <input
                  type="email"
                  value={resetRequestForm.email}
                  onChange={(event) => setResetRequestForm({ email: event.target.value })}
                />
              </label>
              <div className="modal-actions">
                <button type="button" onClick={onSendPasswordResetEmail} disabled={busy}>
                  Link senden
                </button>
                <button type="button" className="ghost-btn" onClick={() => setShowResetRequestModal(false)} disabled={busy}>
                  Abbrechen
                </button>
              </div>
              {resetRequestMessage && <p className="hint">{resetRequestMessage}</p>}
            </section>
          </div>
        )}
        {showPasswordResetModal && (
          <div className="modal-backdrop" onClick={() => setShowPasswordResetModal(false)}>
            <section className="modal-panel" onClick={(event) => event.stopPropagation()}>
              <h3>Neues Passwort setzen</h3>
              <label>
                Neues Passwort
                <input
                  type="password"
                  value={passwordResetForm.password}
                  onChange={(event) => setPasswordResetForm((state) => ({ ...state, password: event.target.value }))}
                />
              </label>
              <label>
                Neues Passwort wiederholen
                <input
                  type="password"
                  value={passwordResetForm.passwordConfirm}
                  onChange={(event) => setPasswordResetForm((state) => ({ ...state, passwordConfirm: event.target.value }))}
                />
              </label>
              <div className="modal-actions">
                <button type="button" onClick={onSaveNewPassword} disabled={busy}>
                  Passwort speichern
                </button>
                <button type="button" className="ghost-btn" onClick={() => setShowPasswordResetModal(false)} disabled={busy}>
                  Abbrechen
                </button>
              </div>
              {passwordResetMessage && <p className="hint">{passwordResetMessage}</p>}
            </section>
          </div>
        )}
      </main>
    );
  }

  const userLabel = (user.user_metadata.username as string | undefined) ?? user.email ?? 'user';
  const availableTags = [...new Set(tasks.flatMap((task) => task.tags))].sort((a, b) => a.localeCompare(b));
  const statusOptions: TaskStatus[] = ['Backlog', 'Ready', 'In Progress', 'Done'];

  const onListMouseEnter = (listId: string) => {
    if (listHoverTimer.current) clearTimeout(listHoverTimer.current);
    listHoverTimer.current = setTimeout(() => {
      setRevealedListActionsId(listId);
    }, 2000);
  };

  const onListMouseLeave = () => {
    if (listHoverTimer.current) {
      clearTimeout(listHoverTimer.current);
      listHoverTimer.current = null;
    }
    setRevealedListActionsId(null);
  };

  const onToggleListsPanel = () => {
    if (isCompactLayout) {
      setShowListsPanel((current) => {
        const next = !current;
        if (next) {
          setShowTagsPanel(false);
        }
        return next;
      });
      return;
    }

    setShowListsPanel((current) => !current);
  };

  const onToggleTagsPanel = () => {
    if (isCompactLayout) {
      setShowTagsPanel((current) => {
        const next = !current;
        if (next) {
          setShowListsPanel(false);
        }
        return next;
      });
      return;
    }

    setShowTagsPanel((current) => !current);
  };

  return (
    <main className="layout">
      <section className="panel app-panel">
        <header className="app-header">
          <div>
            <h1>Everlist</h1>
          </div>
          <div className="head-actions">
            <button
              type="button"
              className="panel-toggle"
              onClick={onToggleListsPanel}
              title={showListsPanel ? 'Listen ausblenden' : 'Listen einblenden'}
            >
              {showListsPanel ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
              <span>Listen</span>
            </button>
            <button
              type="button"
              className="panel-toggle"
              onClick={onToggleTagsPanel}
              title={showTagsPanel ? 'Tags ausblenden' : 'Tags einblenden'}
            >
              {showTagsPanel ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
              <span>Tags</span>
            </button>
            <div className="user-menu-wrap" ref={userMenuRef}>
              <button
                type="button"
                className="user-menu-button"
                onClick={() => setShowUserMenu((current) => !current)}
                title="Account-Menü"
                aria-label="Account-Menü"
              >
                <CircleUserRound size={16} />
              </button>
              {showUserMenu && (
                <div className="user-menu-dropdown">
                  <p className="user-menu-name">{userLabel}</p>
                  <button
                    type="button"
                    className="user-menu-item"
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenAccount();
                    }}
                  >
                    Account...
                  </button>
                  <button
                    type="button"
                    className="user-menu-item"
                    onClick={() => {
                      setShowUserMenu(false);
                      void onLogout();
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className={workspaceGridClass(isCompactLayout, showListsPanel, showTagsPanel)}>
          {isCompactLayout && (showListsPanel || showTagsPanel) && (
            <button
              type="button"
              className="mobile-panel-overlay"
              aria-label="Seitenleiste schließen"
              onClick={() => {
                setShowListsPanel(false);
                setShowTagsPanel(false);
              }}
            />
          )}

          {showListsPanel && (
          <aside className="side-pane side-pane-lists">
            <p className="side-title side-title-row">
              <List size={14} /> Listen
            </p>
            <div className="list-create">
              <input
                placeholder="Neue Liste"
                value={newListName}
                onChange={(event) => setNewListName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void onCreateList();
                  }
                }}
              />
              <IconButton label="Liste anlegen" title="Liste anlegen" onClick={onCreateList} disabled={busy}>
                <Plus size={14} />
              </IconButton>
            </div>
            <div className="list-items">
              <button
                type="button"
                className={listFilter === 'all' ? 'list-item active' : 'list-item'}
                onClick={() => setListFilter('all')}
              >
                alle
              </button>
              {lists.map((list) => (
                <div
                  key={list.listId}
                  className={
                    listFilter === list.listId
                      ? dragOverListId === list.listId
                        ? 'list-item-row active drop-target'
                        : 'list-item-row active'
                      : dragOverListId === list.listId
                        ? 'list-item-row drop-target'
                        : 'list-item-row'
                  }
                  onMouseEnter={() => onListMouseEnter(list.listId)}
                  onMouseLeave={onListMouseLeave}
                  draggable
                  onDragStart={(event) => {
                    setDraggedListId(list.listId);
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', list.listId);
                  }}
                  onDragEnd={() => {
                    setDraggedListId(null);
                    setDragOverTaskId(null);
                  }}
                  onDragEnter={() => {
                    if (draggedTaskId) setDragOverListId(list.listId);
                  }}
                  onDragOver={(event) => {
                    if (!draggedTaskId) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                  }}
                  onDragLeave={() => {
                    if (dragOverListId === list.listId) setDragOverListId(null);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    void onMoveTaskToList(draggedTaskId ?? '', list.listId);
                  }}
                >
                  <button type="button" className="list-item" onClick={() => setListFilter(list.listId)}>
                    {list.name}
                  </button>
                  {!list.isDefault && (
                    <div
                      className={
                        revealedListActionsId === list.listId
                          ? 'list-item-actions visible'
                          : 'list-item-actions'
                      }
                    >
                      <IconButton label="Liste umbenennen" title="Liste umbenennen" onClick={() => onRenameList(list)} disabled={busy}>
                        <Pencil size={13} />
                      </IconButton>
                      <IconButton
                        label="Liste löschen"
                        title="Liste löschen"
                        onClick={() => onDeleteList(list)}
                        disabled={busy}
                        danger
                      >
                        <Trash2 size={13} />
                      </IconButton>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>
          )}

          <section className="main-pane">
            <section className="task-filters">
              <input
                placeholder="Suche in Titel/Beschreibung"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </section>

            <div className="tabs">
              <button className={taskMode === 'active' ? 'tab active' : 'tab'} onClick={() => setTaskMode('active')} type="button">
                Aktiv
              </button>
              <button
                className={taskMode === 'archived' ? 'tab active' : 'tab'}
                onClick={() => setTaskMode('archived')}
                type="button"
              >
                Done (Archiv)
              </button>
            </div>

            <section className="task-create">
              <input
                placeholder="Neue Aufgabe"
                value={newTaskTitle}
                onChange={(event) => setNewTaskTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void onCreateTask();
                  }
                }}
              />
              <IconButton
                label="Aufgabe anlegen"
                title="Aufgabe anlegen"
                onClick={onCreateTask}
                disabled={busy}
                primary
              >
                <Check size={14} />
              </IconButton>
            </section>

            <ul className="task-list">
              {tasks.map((task) => (
                <li
                  key={task.taskId}
                  className={
                    isDue(task.dueDate) && task.status !== 'Done'
                      ? draggedTaskId === task.taskId
                        ? 'task overdue dragging'
                        : dragOverTaskId === task.taskId
                          ? 'task overdue drop-target'
                        : 'task overdue'
                      : draggedTaskId === task.taskId
                        ? 'task dragging'
                        : dragOverTaskId === task.taskId
                          ? 'task drop-target'
                        : 'task'
                  }
                  draggable={editTask?.taskId !== task.taskId}
                  onDragStart={(event) => {
                    setDraggedTaskId(task.taskId);
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', task.taskId);
                  }}
                  onDragEnd={() => {
                    setDraggedTaskId(null);
                    setDragOverListId(null);
                  }}
                  onDragEnter={() => {
                    if (draggedListId) setDragOverTaskId(task.taskId);
                  }}
                  onDragOver={(event) => {
                    if (!draggedListId) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                  }}
                  onDragLeave={() => {
                    if (dragOverTaskId === task.taskId) setDragOverTaskId(null);
                  }}
                  onDrop={(event) => {
                    if (!draggedListId) return;
                    event.preventDefault();
                    void onMoveTaskToList(task.taskId, draggedListId);
                  }}
                >
                  {editTask?.taskId === task.taskId ? (
                    <div className="task-edit">
                      <input
                        value={editTask.title}
                        onChange={(event) =>
                          setEditTask((state) => (state ? { ...state, title: event.target.value } : null))
                        }
                      />
                      <textarea
                        value={editTask.description}
                        onChange={(event) =>
                          setEditTask((state) => (state ? { ...state, description: event.target.value } : null))
                        }
                        placeholder="Beschreibung"
                      />
                      <input
                        type="date"
                        value={editTask.dueDate}
                        onChange={(event) =>
                          setEditTask((state) => (state ? { ...state, dueDate: event.target.value } : null))
                        }
                      />
                      <select
                        value={editTask.listId}
                        onChange={(event) => setEditTask((state) => (state ? { ...state, listId: event.target.value } : null))}
                      >
                        {lists.map((list) => (
                          <option key={list.listId} value={list.listId}>
                            {list.name}
                          </option>
                        ))}
                      </select>
                      <StatusChipPicker
                        value={editTask.status}
                        onChange={(status) => setEditTask((state) => (state ? { ...state, status } : null))}
                      />
                      <TagInput
                        tags={editTask.tags}
                        onChange={(tags) => setEditTask((state) => (state ? { ...state, tags } : null))}
                      />
                      <div className="task-actions">
                        <IconButton label="Speichern" title="Speichern" onClick={onSaveEditTask} disabled={busy}>
                          <Check size={14} />
                        </IconButton>
                        <IconButton label="Abbrechen" title="Abbrechen" onClick={() => setEditTask(null)} disabled={busy}>
                          <X size={14} />
                        </IconButton>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="title">{task.title}</p>
                        <p className="meta">
                          Status:{' '}
                          <span className={statusChipClass(task.status)}>{task.status}</span>
                        </p>
                        {task.description && <p className="meta">{task.description}</p>}
                        {task.dueDate && <p className="meta">Fällig: {task.dueDate}</p>}
                        <p className="meta">Liste: {resolveListName(lists, task.listId)}</p>
                        {task.tags.length > 0 && <p className="meta">Tags: {task.tags.join(', ')}</p>}
                      </div>
                      <div className="task-actions">
                        <IconButton
                          label={task.status === 'Done' ? 'Wieder aktiv' : 'Als Done markieren'}
                          title={task.status === 'Done' ? 'Wieder aktiv' : 'Als Done markieren'}
                          onClick={() => onToggleDone(task)}
                          disabled={busy}
                          primary
                        >
                          {task.status === 'Done' ? <RotateCcw size={14} /> : <CheckCheck size={14} />}
                        </IconButton>
                        <IconButton label="Bearbeiten" title="Bearbeiten" onClick={() => onStartEditTask(task)} disabled={busy}>
                          <Pencil size={14} />
                        </IconButton>
                        <IconButton
                          label="Löschen"
                          title="Löschen"
                          onClick={() => onDeleteTask(task.taskId)}
                          disabled={busy}
                          danger
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>

            {tasks.length === 0 && <p className="hint">Keine Aufgaben in diesem Tab.</p>}
          </section>

          {showTagsPanel && (
          <aside className="side-pane side-pane-tags">
            <p className="side-title side-title-row">
              <CheckCheck size={14} /> Status
            </p>
            <div className="status-picker side-status-picker">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={
                    activeStatusFilters.includes(status)
                      ? `${statusChipClass(status)} selected`
                      : statusChipClass(status)
                  }
                  onClick={() =>
                    setActiveStatusFilters((current) =>
                      current.includes(status) ? current.filter((value) => value !== status) : [...current, status],
                    )
                  }
                >
                  {status}
                </button>
              ))}
            </div>
            <p className="side-title side-title-row side-subtitle">
              <Tags size={14} /> Tags
            </p>
            <div className="tag-chips side-tag-chips">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  className={activeTagFilter === tag ? 'chip active' : 'chip'}
                  type="button"
                  onClick={() => setActiveTagFilter((current) => (current === tag ? null : tag))}
                >
                  {tag}
                </button>
              ))}
            </div>
          </aside>
          )}
        </section>

        {authMessage && <p className="hint">{authMessage}</p>}
      </section>
      {showAccountModal && user && (
        <div className="modal-backdrop" onClick={() => setShowAccountModal(false)}>
          <section className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <h3>Account</h3>
            <label>
              E-Mail
              <input type="email" value={user.email ?? ''} readOnly />
            </label>
            <label>
              Username
              <input
                type="text"
                value={accountForm.username}
                onChange={(event) => setAccountForm((state) => ({ ...state, username: event.target.value }))}
              />
            </label>
            <label>
              Neues Passwort
              <input
                type="password"
                value={accountForm.password}
                onChange={(event) => setAccountForm((state) => ({ ...state, password: event.target.value }))}
              />
            </label>
            <label>
              Neues Passwort wiederholen
              <input
                type="password"
                value={accountForm.passwordConfirm}
                onChange={(event) => setAccountForm((state) => ({ ...state, passwordConfirm: event.target.value }))}
              />
            </label>
            <div className="modal-actions">
              <button type="button" onClick={onSaveAccount} disabled={busy}>
                Speichern
              </button>
              <button type="button" className="ghost-btn" onClick={() => setShowAccountModal(false)} disabled={busy}>
                Schließen
              </button>
            </div>
            {accountMessage && <p className="hint">{accountMessage}</p>}
          </section>
        </div>
      )}
      {showResetRequestModal && (
        <div className="modal-backdrop" onClick={() => setShowResetRequestModal(false)}>
          <section className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <h3>Passwort zurücksetzen</h3>
            <p className="hint">Du bekommst einen Link per E-Mail von Supabase.</p>
            <label>
              E-Mail
              <input
                type="email"
                value={resetRequestForm.email}
                onChange={(event) => setResetRequestForm({ email: event.target.value })}
              />
            </label>
            <div className="modal-actions">
              <button type="button" onClick={onSendPasswordResetEmail} disabled={busy}>
                Link senden
              </button>
              <button type="button" className="ghost-btn" onClick={() => setShowResetRequestModal(false)} disabled={busy}>
                Abbrechen
              </button>
            </div>
            {resetRequestMessage && <p className="hint">{resetRequestMessage}</p>}
          </section>
        </div>
      )}
      {showPasswordResetModal && (
        <div className="modal-backdrop" onClick={() => setShowPasswordResetModal(false)}>
          <section className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <h3>Neues Passwort setzen</h3>
            <label>
              Neues Passwort
              <input
                type="password"
                value={passwordResetForm.password}
                onChange={(event) => setPasswordResetForm((state) => ({ ...state, password: event.target.value }))}
              />
            </label>
            <label>
              Neues Passwort wiederholen
              <input
                type="password"
                value={passwordResetForm.passwordConfirm}
                onChange={(event) => setPasswordResetForm((state) => ({ ...state, passwordConfirm: event.target.value }))}
              />
            </label>
            <div className="modal-actions">
              <button type="button" onClick={onSaveNewPassword} disabled={busy}>
                Passwort speichern
              </button>
              <button type="button" className="ghost-btn" onClick={() => setShowPasswordResetModal(false)} disabled={busy}>
                Abbrechen
              </button>
            </div>
            {passwordResetMessage && <p className="hint">{passwordResetMessage}</p>}
          </section>
        </div>
      )}
    </main>
  );
}

function resolveListName(lists: ListView[], listId: string | null): string {
  if (!listId) return 'default';
  return lists.find((list) => list.listId === listId)?.name ?? 'unbekannt';
}

function statusChipClass(status: TaskView['status']): string {
  switch (status) {
    case 'Backlog':
      return 'status-chip backlog';
    case 'Ready':
      return 'status-chip ready';
    case 'In Progress':
      return 'status-chip inprogress';
    case 'Done':
      return 'status-chip done';
    default:
      return 'status-chip';
  }
}

function workspaceGridClass(isCompactLayout: boolean, showListsPanel: boolean, showTagsPanel: boolean): string {
  if (isCompactLayout) return 'workspace-grid compact';
  if (showListsPanel && showTagsPanel) return 'workspace-grid both-open';
  if (showListsPanel) return 'workspace-grid left-open';
  if (showTagsPanel) return 'workspace-grid right-open';
  return 'workspace-grid center-only';
}

function StatusChipPicker(props: {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
}) {
  const statuses: TaskStatus[] = ['Backlog', 'Ready', 'In Progress', 'Done'];

  return (
    <div className="status-picker" role="radiogroup" aria-label="Status auswählen">
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          role="radio"
          aria-checked={props.value === status}
          className={props.value === status ? `${statusChipClass(status)} selected` : statusChipClass(status)}
          onClick={() => props.onChange(status)}
          title={`Status ${status}`}
        >
          {status}
        </button>
      ))}
    </div>
  );
}

function buildTaskQueryInput(
  mode: TaskViewMode,
  searchText: string,
  tag: string | null,
  statuses: TaskStatus[],
  listFilter: ListFilter,
): QueryTasksInput {
  const input: QueryTasksInput = {
    mode,
    searchText: searchText || undefined,
    tag: tag ?? undefined,
    statuses: statuses.length > 0 ? statuses : undefined,
  };

  if (listFilter !== 'all') {
    input.listId = listFilter;
  }

  return input;
}

async function refreshTasks(
  processor: ClientProcessor,
  mode: TaskViewMode,
  searchText: string,
  tag: string | null,
  statuses: TaskStatus[],
  listFilter: ListFilter,
  setTasks: (tasks: TaskView[]) => void,
  setMessage: (message: string | null) => void,
) {
  await loadTasks(processor, buildTaskQueryInput(mode, searchText, tag, statuses, listFilter), setTasks, setMessage);
}

async function refreshLists(
  processor: ClientProcessor,
  setLists: (lists: ListView[]) => void,
  setMessage: (message: string | null) => void,
) {
  try {
    setLists(await processor.queryLists());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Listen konnten nicht geladen werden.';
    setMessage(message);
  }
}

async function loadTasks(
  processor: ClientProcessor,
  input: QueryTasksInput,
  setTasks: (tasks: TaskView[]) => void,
  setMessage: (message: string | null) => void,
) {
  try {
    setTasks(await processor.queryTasks(input));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tasks konnten nicht geladen werden.';
    setMessage(message);
  }
}

function isDue(dueDate: string | undefined): boolean {
  if (!dueDate) return false;

  const today = new Date();
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const due = new Date(`${dueDate}T00:00:00`);
  return due <= localToday;
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Passwort muss mindestens 8 Zeichen lang sein.';

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z\d]/.test(password)) {
    return 'Passwort braucht Buchstaben, Ziffern und Sonderzeichen.';
  }

  return null;
}

function getAuthEmailRedirectUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

function IconButton(props: {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  const className = ['icon-btn', props.primary ? 'primary' : '', props.danger ? 'danger' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={className}
      aria-label={props.label}
      title={props.title}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.children}
      <span className="sr-only">{props.label}</span>
    </button>
  );
}

function TagInput(props: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const addTag = () => {
    const next = draft.trim().toLowerCase();
    if (!next) return;
    if (!props.tags.includes(next)) props.onChange([...props.tags, next]);
    setDraft('');
  };

  const removeTag = (tag: string) => {
    props.onChange(props.tags.filter((value) => value !== tag));
  };

  return (
    <div className="tag-input">
      <div className="tag-input-chips">
        {props.tags.map((tag) => (
          <button key={tag} type="button" className="tag-pill" onClick={() => removeTag(tag)} title={`Tag ${tag} entfernen`}>
            {tag}
            <span aria-hidden="true">×</span>
          </button>
        ))}
        <input
          className="tag-input-field"
          value={draft}
          placeholder="tag eingeben"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={addTag}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              addTag();
              return;
            }
            if (event.key === 'Backspace' && !draft && props.tags.length > 0) {
              props.onChange(props.tags.slice(0, -1));
            }
          }}
        />
      </div>
    </div>
  );
}

export default App;
