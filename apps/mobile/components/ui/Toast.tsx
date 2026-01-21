/**
 * Toast Configuration
 *
 * Custom styled toast messages for the app.
 * Story: 6-1 Error Handling & User Feedback
 */

import { View, Text } from 'react-native';
import { BaseToast, ErrorToast, ToastConfigParams } from 'react-native-toast-message';

export const toastConfig = {
  success: (props: ToastConfigParams<unknown>) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#10B981',
        borderLeftWidth: 4,
        backgroundColor: '#ECFDF5',
        height: 'auto',
        paddingVertical: 12,
      }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{
        fontSize: 15,
        fontWeight: '600',
        color: '#065F46',
      }}
      text2Style={{
        fontSize: 13,
        color: '#047857',
      }}
      text2NumberOfLines={2}
    />
  ),

  error: (props: ToastConfigParams<unknown>) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#DC2626',
        borderLeftWidth: 4,
        backgroundColor: '#FEF2F2',
        height: 'auto',
        paddingVertical: 12,
      }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{
        fontSize: 15,
        fontWeight: '600',
        color: '#991B1B',
      }}
      text2Style={{
        fontSize: 13,
        color: '#B91C1C',
      }}
      text2NumberOfLines={2}
    />
  ),

  info: (props: ToastConfigParams<unknown>) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#F59E0B',
        borderLeftWidth: 4,
        backgroundColor: '#FFFBEB',
        height: 'auto',
        paddingVertical: 12,
      }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{
        fontSize: 15,
        fontWeight: '600',
        color: '#92400E',
      }}
      text2Style={{
        fontSize: 13,
        color: '#B45309',
      }}
      text2NumberOfLines={2}
    />
  ),

  // Custom toast for network errors
  network: ({ text1, text2, hide: _hide }: ToastConfigParams<unknown>) => (
    <View
      style={{
        width: '90%',
        backgroundColor: '#1F2937',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#374151',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 20 }}>📡</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#F3F4F6', fontSize: 15, fontWeight: '600' }}>
          {text1}
        </Text>
        {text2 && (
          <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 2 }}>
            {text2}
          </Text>
        )}
      </View>
    </View>
  ),
};
