"use client";

import React, { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";

type CollabEditorProps = {
  socket?: any;
  roomId: string | null;
  userName?: string;
};

export default function CollabEditor({
  socket, roomId, userName = "Anonymous"
}: CollabEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const applyingRemoteRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const disconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const remoteDecorationsRef = useRef<Map<string, string[]>>(new Map());
  const remoteWidgetsRef = useRef<Map<string, { widget: monaco.editor.IContentWidget; dom: HTMLElement }>>(new Map());

  const [sentCount, setSentCount] = useState(0);
  const [recvCount, setRecvCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  // Monaco setup and THEME
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof (window as any).MonacoEnvironment === "undefined") {
      (window as any).MonacoEnvironment = { getWorkerUrl: () => "/monaco/editor.worker.js" };
    }
    if (containerRef.current && !editorRef.current) {
      monaco.editor.defineTheme("peerprep-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "", foreground: "958AD5" },
          { token: "string", foreground: "8ec1e7" },
          { token: "keyword", foreground: "7316D7" },
          { token: "number", foreground: "5ae2c6" },
          { token: "comment", foreground: "D0CAED" },
        ],
        colors: {
          "editor.background": "#13122b",           // --black-box
          "editor.foreground": "#958AD5",             // --text-main
          "editor.lineHighlightBackground": "#2119566E", // --dark-box
          "editorCursor.foreground": "#6E5AE2",       // --logo-purple
          "editor.selectionBackground": "#6e5ae24a",  // --color-light-box
          "editorWidget.background": "#21195644",     // --darkest-box
          "editorLineNumber.foreground": "#958ad57a", // --text-dark-purple
        }
      });
      const model = monaco.editor.createModel("", "plaintext");
      editorRef.current = monaco.editor.create(containerRef.current, {
        model,
        automaticLayout: true,
        minimap: { enabled: false },
        theme: "peerprep-dark",
        fontFamily: "var(--font-geist-mono), var(--font-mono), 'Menlo', monospace",
        fontSize: 20,
        lineNumbers: "on"
      });
    }
    return () => {
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, []);

  // Socket-based collaboration (no Yjs)
  useEffect(() => {
    const editor = editorRef.current;
    if (!socket || !roomId || !editor) return;

    const doJoinFallback = () => {
      try { socket.emit('forceJoinRoom', { roomId, username: userName }); } catch {}
    };
    if (socket.connected) doJoinFallback(); else socket.once('connect', doJoinFallback);

    try { socket.emit('requestEditorSync', { roomId }); } catch {}
    socket.on('connect', () => {
      try { socket.emit('requestEditorSync', { roomId }); } catch {}
    });

    // Emit local changes (debounced)
    const model = editor.getModel();
    const onModelChange = model?.onDidChangeContent(() => {
      if (applyingRemoteRef.current) return;
      if (!model) return;
      const content = model.getValue();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        socket.emit('editorTextChanged', { roomId, content, version: Date.now() });
        setSentCount(n => n + 1);
      }, 120);
    });

    // Apply remote changes
    const onEditorTextChanged = (data: { content: string; version?: number; senderId?: string }) => {
      const model = editorRef.current?.getModel();
      if (!model) return;
      const myContent = model.getValue();
      if (data.content === myContent) return;
      applyingRemoteRef.current = true;
      model.pushEditOperations([], [{ range: model.getFullModelRange(), text: data.content }], () => null);
      applyingRemoteRef.current = false;
      setRecvCount(n => n + 1);
    };
    socket.on('editorTextChanged', onEditorTextChanged);

    // Color the cursor: alternate between logo-purple and logo-green for users
    const hashToColor = (id: string) => {
      // If you want true alternation, use user index. For now, hash id.
      let h = 0;
      for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
      // Even: purple, Odd: green
      return h % 2 === 0 ? "var(--color-logo-purple)" : "var(--color-lg-button)";
    };
    const ensureUserStyle = (userId: string, color: string) => {
      const styleId = `cursor-style-${userId}`;
      if (document.getElementById(styleId)) return;
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .remote-cursor-${userId} { border-left: 2px solid ${color}; }
        .remote-select-${userId} { background-color: ${color}33; }
      `;
      document.head.appendChild(style);
    };
    const sendCursor = () => {
      const sel = editor.getSelection();
      if (!sel) return;
      const selection = {
        start: { line: sel.startLineNumber, column: sel.startColumn },
        end: { line: sel.endLineNumber, column: sel.endColumn },
      };
      const color = hashToColor(userName || socket.id);
      socket.emit('cursorUpdate', { roomId, userId: socket.id, username: userName, selection, color });
    };
    const dispSel = editor.onDidChangeCursorSelection(sendCursor);
    const onCursorUpdate = (data: { userId: string; username?: string; selection: any; color?: string; senderId?: string }) => {
      if (!editorRef.current) return;
      const model = editorRef.current.getModel();
      if (!model) return;
      const userId = data.userId || data.senderId || 'peer';
      if (userId === socket.id) return;
      const color = data.color || hashToColor(userId);
      ensureUserStyle(userId, color);
      const prev = remoteDecorationsRef.current.get(userId) || [];
      const start = data.selection.start; const end = data.selection.end;
      const range = new monaco.Range(start.line, start.column, end.line, end.column);
      const isCollapsed = start.line === end.line && start.column === end.column;
      const newIds = model.deltaDecorations(prev, [
        {
          range,
          options: isCollapsed
            ? { className: `remote-cursor-${userId}`, stickiness: 1 }
            : { className: `remote-select-${userId}`, stickiness: 1 }
        }
      ]);
      remoteDecorationsRef.current.set(userId, newIds);

      const pos = new monaco.Position(start.line, start.column);
      const widgetId = `remote-name-${userId}`;
      let entry = remoteWidgetsRef.current.get(userId);
      if (!entry) {
        const dom = document.createElement('div');
        dom.style.position = 'absolute';
        dom.style.pointerEvents = 'none';
        dom.style.background = color;
        dom.style.color = '#fff';
        dom.style.padding = '1px 4px';
        dom.style.borderRadius = '3px';
        dom.style.fontSize = '20px';
        dom.style.transform = 'translateY(-6px)';
        dom.textContent = data.username || 'peer';
        const widget: monaco.editor.IContentWidget = {
          getId: () => widgetId,
          getDomNode: () => dom,
          getPosition: () => ({ position: pos, preference: [monaco.editor.ContentWidgetPositionPreference.ABOVE] })
        };
        editorRef.current.addContentWidget(widget);
        remoteWidgetsRef.current.set(userId, { widget, dom });
      } else {
        entry.dom.textContent = data.username || 'peer';
        entry.dom.style.background = color;
        const w = entry.widget;
        (w as any).getPosition = () => ({ position: pos, preference: [monaco.editor.ContentWidgetPositionPreference.ABOVE] });
        editorRef.current.layoutContentWidget(w);
      }
    };
    socket.on('cursorUpdate', onCursorUpdate);

    // Disconnection handling (unchanged)
    const onDisconnect = () => {
      setToast('You have been disconnected. Trying to reconnect...');
      editor.updateOptions({ readOnly: true });
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = setTimeout(() => {
        setToast('Unable to rejoin room. Redirecting...');
        setTimeout(() => { window.location.href = '/dashboard'; }, 1500);
      }, 2 * 60 * 1000);
    };
    const onRejoin = () => {
      if (disconnectTimerRef.current) { clearTimeout(disconnectTimerRef.current); disconnectTimerRef.current = null; }
      setToast('Reconnected to room');
      editor.updateOptions({ readOnly: false });
      setTimeout(() => setToast(null), 1500);
    };
    const onConnect = () => { if (disconnectTimerRef.current) onRejoin(); };
    socket.on('disconnect', onDisconnect);
    socket.on('rejoinRoom', onRejoin);
    socket.on('connect', onConnect);

    return () => {
      if (onModelChange) onModelChange.dispose();
      socket.off('editorTextChanged', onEditorTextChanged);
      dispSel?.dispose();
      socket.off('cursorUpdate', onCursorUpdate);
      socket.off('disconnect', onDisconnect);
      socket.off('rejoinRoom', onRejoin);
      socket.off('connect', onConnect);
      if (editorRef.current) {
        remoteWidgetsRef.current.forEach(({ widget }) => editorRef.current?.removeContentWidget(widget));
      }
      remoteWidgetsRef.current.clear();
      if (debounceTimerRef.current) { clearTimeout(debounceTimerRef.current); debounceTimerRef.current = null; }
    };
  }, [socket, roomId]);

  return (
    <main className="flex flex-col items-center justify-center w-full h-full">
      <div
        ref={containerRef}
        className="w-full h-full border-0"
        style={{
          minHeight: "350px",
          background: "var(--black-box)",
        }}
      />
      {toast && (
        <div className="fixed bottom-4 left-4 z-50 mb-2 bg-yellow-600 text-white px-3 py-2 rounded">{toast}</div>
      )}
    </main>
  );
}
