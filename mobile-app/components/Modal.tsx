import React, { createContext, useContext, useState } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewProps,
  TextProps,
  TouchableOpacityProps,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Context for Dialog state management
interface DialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog provider');
  }
  return context;
}

// Dialog Root Component
interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open: controlledOpen, onOpenChange, children }: DialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

// Dialog Trigger
interface DialogTriggerProps extends TouchableOpacityProps {
  children: React.ReactNode;
}

export function DialogTrigger({ children, ...props }: DialogTriggerProps) {
  const { setOpen } = useDialog();
  
  return (
    <TouchableOpacity onPress={() => setOpen(true)} {...props}>
      {children}
    </TouchableOpacity>
  );
}

// Dialog Portal (not needed in RN, but kept for API compatibility)
interface DialogPortalProps {
  children: React.ReactNode;
}

export function DialogPortal({ children }: DialogPortalProps) {
  return <>{children}</>;
}

// Dialog Close
interface DialogCloseProps extends TouchableOpacityProps {
  children: React.ReactNode;
}

export function DialogClose({ children, onPress, ...props }: DialogCloseProps) {
  const { setOpen } = useDialog();
  
  return (
    <TouchableOpacity
      onPress={(e) => {
        setOpen(false);
        onPress?.(e);
      }}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}

// Dialog Overlay
interface DialogOverlayProps extends ViewProps {
  onPress?: () => void;
}

export function DialogOverlay({ style, onPress, ...props }: DialogOverlayProps) {
  return (
    <Pressable
      style={[styles.overlay, style]}
      onPress={onPress}
      {...props}
    />
  );
}

// Dialog Content
interface DialogContentProps extends ViewProps {
  children: React.ReactNode;
}

export function DialogContent({ children, style, ...props }: DialogContentProps) {
  const { open, setOpen } = useDialog();

  return (
    <RNModal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => setOpen(false)}
    >
      <View style={styles.modalContainer}>
        <DialogOverlay onPress={() => setOpen(false)} />
        <View style={[styles.content, style]} {...props}>
          {children}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setOpen(false)}
          >
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>
    </RNModal>
  );
}

// Dialog Header
interface DialogHeaderProps extends ViewProps {
  children: React.ReactNode;
}

export function DialogHeader({ children, style, ...props }: DialogHeaderProps) {
  return (
    <View style={[styles.header, style]} {...props}>
      {children}
    </View>
  );
}

// Dialog Footer
interface DialogFooterProps extends ViewProps {
  children: React.ReactNode;
}

export function DialogFooter({ children, style, ...props }: DialogFooterProps) {
  return (
    <View style={[styles.footer, style]} {...props}>
      {children}
    </View>
  );
}

// Dialog Title
interface DialogTitleProps extends TextProps {
  children: React.ReactNode;
}

export function DialogTitle({ children, style, ...props }: DialogTitleProps) {
  return (
    <Text style={[styles.title, style]} {...props}>
      {children}
    </Text>
  );
}

// Dialog Description
interface DialogDescriptionProps extends TextProps {
  children: React.ReactNode;
}

export function DialogDescription({ children, style, ...props }: DialogDescriptionProps) {
  return (
    <Text style={[styles.description, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    paddingTop: 32,
    width: '90%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    zIndex: 10,
  },
  header: {
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  title: {
    color: '#101828',
    fontFamily: 'Nunito',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});
