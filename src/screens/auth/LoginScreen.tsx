import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store/useAppStore';
import { signInWithEmailPassword } from '../../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  
  const navigation = useNavigation();
  const { setUser, setAuthenticated } = useAppStore();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailFocus = useCallback(() => {
    console.log('📧 Email input focused');
    setEmailFocused(true);
  }, []);
  
  const handleEmailBlur = useCallback(() => {
    console.log('📧 Email input blurred');
    setEmailFocused(false);
  }, []);
  
  const handlePasswordFocus = useCallback(() => {
    console.log('🔒 Password input focused');
    setPasswordFocused(true);
  }, []);
  
  const handlePasswordBlur = useCallback(() => {
    console.log('🔒 Password input blurred');
    setPasswordFocused(false);
  }, []);
  const togglePasswordVisibility = useCallback(() => setShowPassword(!showPassword), [showPassword]);

  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    if (emailError) setEmailError('');
  }, [emailError]);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError('');
  }, [passwordError]);

  const handleLogin = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Validation
    let hasError = false;
    
    if (!email.trim()) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    try {
      const user = await signInWithEmailPassword(email, password);
      setUser(user);
      setAuthenticated(true);
      Alert.alert(
        '🎉 Welcome Back!', 
        `Successfully logged in to SnapConnect!\n\nHello ${user.displayName}!`,
        [{ text: 'Continue', style: 'default' }]
      );
    } catch (error) {
      Alert.alert(
        '❌ Login Failed', 
        'Invalid email or password. Please check your credentials and try again.',
        [{ text: 'Try Again', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const goToRegister = () => {
    navigation.navigate('Register' as never);
  };

  const goToForgotPassword = () => {
    navigation.navigate('ForgotPassword' as never);
  };

  const handleDemoLogin = async () => {
    Alert.alert(
      '🚀 Demo Mode',
      'Experience SnapConnect with a demo account! You can explore all features without creating an account.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue as Demo', 
          style: 'default',
          onPress: async () => {
            setIsLoading(true);
            try {
              console.log('🔐 LOGIN: Demo login started...');
              
              const persistedUserData = await AsyncStorage.getItem('@snapconnect_user_data');
              
              if (persistedUserData) {
                // Use existing persisted user data
                console.log('🔐 LOGIN: Found existing user data in AsyncStorage');
                const existingUser = JSON.parse(persistedUserData);
                const restoredUser = {
                  ...existingUser,
                  createdAt: new Date(existingUser.createdAt),
                  updatedAt: new Date(existingUser.updatedAt),
                };
                setUser(restoredUser);
                console.log('✅ LOGIN: Successfully restored existing user');
              } else {
                // Create new demo user
                console.log('🔐 LOGIN: Creating new demo user');
                const demoUser = {
                  id: 'demo-user',
                  email: 'demo@snapconnect.app',
                  username: 'SnapDemo',
                  displayName: 'Demo User',
                  bio: 'Exploring SnapConnect! 🎉',
                  snapScore: 0,
                  bestFriends: ['john_doe', 'sarah_wilson'],
                  blockedUsers: [],
                  privacySettings: {
                    whoCanContactMe: 'friends' as const,
                    whoCanSeeMyStory: 'friends' as const,
                    whoCanSeeMyLocation: 'nobody' as const,
                    showMeInQuickAdd: true,
                  },
                  followers: 1250,
                  following: 890,
                  isVerified: true,
                  avatarEmoji: '😎',
                  streakEmoji: '🔥',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
                setUser(demoUser);
                console.log('✅ LOGIN: New demo user created and saved');
              }
              
              setAuthenticated(true);
              
              Alert.alert(
                '🎮 Demo Mode Active',
                'Welcome to SnapConnect! You\'re now using a demo account. Explore all the features!',
                [{ text: 'Get Started', style: 'default' }]
              );
            } catch (error) {
              console.error('Error loading demo user:', error);
              Alert.alert('Error', 'Failed to load demo mode. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always" 
          keyboardDismissMode="none"
          scrollEnabled={true}
          bounces={false}
          automaticallyAdjustKeyboardInsets={false}
          automaticallyAdjustContentInsets={false}
        >
          {/* Enhanced Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>📸</Text>
              <View style={styles.logoGlow} />
            </View>
            <Text style={styles.title}>SnapConnect</Text>
            <Text style={styles.subtitle}>Connect • Share • Discover</Text>
            <Text style={styles.welcomeText}>Welcome back! Sign in to continue</Text>
          </View>

          {/* Enhanced Login Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TouchableOpacity 
                activeOpacity={1}
                onPress={() => {
                  console.log('📧 Email wrapper pressed, attempting to focus...');
                  // Force focus on the TextInput
                  emailInputRef.current?.focus();
                }}
                style={[
                  styles.inputWrapper,
                  emailFocused && styles.inputFocused,
                  emailError && styles.inputError
                ]}
              >
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  ref={emailInputRef}
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#9E9E9E"
                  value={email}
                  onChangeText={handleEmailChange}
                  onFocus={handleEmailFocus}
                  onBlur={handleEmailBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  textContentType="emailAddress"
                  autoFocus={false}
                  selectTextOnFocus={false}
                />
              </TouchableOpacity>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TouchableOpacity 
                activeOpacity={1}
                onPress={() => {
                  console.log('🔒 Password wrapper pressed, attempting to focus...');
                  // Force focus on the TextInput
                  passwordInputRef.current?.focus();
                }}
                style={[
                  styles.inputWrapper,
                  passwordFocused && styles.inputFocused,
                  passwordError && styles.inputError
                ]}
              >
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  ref={passwordInputRef}
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#9E9E9E"
                  value={password}
                  onChangeText={handlePasswordChange}
                  onFocus={handlePasswordFocus}
                  onBlur={handlePasswordBlur}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  returnKeyType="done"
                  blurOnSubmit={false}
                  textContentType="password"
                  autoFocus={false}
                  selectTextOnFocus={false}
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={togglePasswordVisibility}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            <TouchableOpacity style={styles.forgotButton} onPress={goToForgotPassword}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#0D0D0F" />
                  <Text style={styles.loginButtonText}>Signing in...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Enhanced Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={goToRegister}>
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Enhanced Demo Mode Button */}
          <TouchableOpacity 
            style={styles.demoButton}
            onPress={handleDemoLogin}
            disabled={isLoading}
          >
            <View style={styles.demoButtonContent}>
              <Text style={styles.demoIcon}>🎮</Text>
              <View>
                <Text style={styles.demoText}>Try Demo Mode</Text>
                <Text style={styles.demoSubtext}>Explore without signing up</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Security Badge */}
          <View style={styles.securityBadge}>
            <Text style={styles.securityIcon}>🔐</Text>
            <Text style={styles.securityText}>Your data is secure and encrypted</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 15,
  },
  logo: {
    fontSize: 70,
    marginBottom: 10,
  },
  logoGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFDD3A',
    opacity: 0.1,
    borderRadius: 50,
    transform: [{ scale: 1.5 }],
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFDD3A',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  welcomeText: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161618',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#424242',
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderColor: '#FFDD3A',
    shadowColor: '#FFDD3A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    paddingVertical: 16,
    fontSize: 16,
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 18,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 30,
    paddingVertical: 8,
  },
  forgotText: {
    color: '#FFDD3A',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#FFDD3A',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FFDD3A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#0D0D0F',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  footerText: {
    color: '#9E9E9E',
    fontSize: 16,
  },
  signUpText: {
    color: '#FFDD3A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  demoButton: {
    backgroundColor: '#161618',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#424242',
    marginBottom: 20,
  },
  demoButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  demoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  demoSubtext: {
    color: '#9E9E9E',
    fontSize: 12,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  securityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  securityText: {
    color: '#9E9E9E',
    fontSize: 12,
    fontStyle: 'italic',
  },
}); 