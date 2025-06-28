import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store/useAppStore';
import { signInWithGoogle, signInWithApple, signInWithEmailPassword } from '../../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigation = useNavigation();
  const { setUser, setAuthenticated, setLoading } = useAppStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setLoading(true);

    try {
      const user = await signInWithEmailPassword(email, password);
      setUser(user);
      setAuthenticated(true);
      Alert.alert('Welcome!', 'Successfully logged in to SnapConnect');
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setLoading(true);

    try {
      const user = await signInWithGoogle();
      setUser(user);
      setAuthenticated(true);
      Alert.alert('Welcome!', `Successfully signed in with Google!`);
    } catch (error: any) {
      Alert.alert('Google Sign-In Failed', error.message || 'Please try again.');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    setLoading(true);

    try {
      const user = await signInWithApple();
      setUser(user);
      setAuthenticated(true);
      Alert.alert('Welcome!', `Successfully signed in with Apple!`);
    } catch (error: any) {
      Alert.alert('Apple Sign-In Failed', error.message || 'Please try again.');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const goToRegister = () => {
    navigation.navigate('Register' as never);
  };

  const goToForgotPassword = () => {
    navigation.navigate('ForgotPassword' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Logo/Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>📸</Text>
            <Text style={styles.title}>SnapConnect</Text>
            <Text style={styles.subtitle}>Connect • Share • Discover</Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9E9E9E"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#9E9E9E"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotButton} onPress={goToForgotPassword}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Social Login Options */}
          <View style={styles.socialSection}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity 
                style={[styles.socialButton, isLoading && styles.disabledButton]}
                onPress={handleAppleSignIn}
                disabled={isLoading}
              >
                <Text style={styles.socialIcon}>🍎</Text>
                <Text style={styles.socialText}>Apple</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.socialButton, isLoading && styles.disabledButton]}
                onPress={handleGoogleSignIn}
                disabled={isLoading}
              >
                <Text style={styles.socialIcon}>📱</Text>
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={goToRegister}>
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Demo Mode Toggle */}
          <TouchableOpacity 
            style={styles.demoButton}
            onPress={() => {
              Alert.alert(
                '🚀 Demo Mode',
                'Continue as demo user without creating an account?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Continue as Demo', 
                    onPress: async () => {
                      try {
                        console.log('🔐 LOGIN: Demo login started...');
                        // Check if there's already a persisted demo user
                        console.log('🔐 LOGIN: Checking AsyncStorage for existing user...');
                        
                        // Debug: Show all AsyncStorage keys
                        try {
                          const allKeys = await AsyncStorage.getAllKeys();
                          console.log('🔐 LOGIN: All AsyncStorage keys:', allKeys);
                        } catch (e) {
                          console.log('🔐 LOGIN: Could not get AsyncStorage keys');
                        }
                        
                        const persistedUserData = await AsyncStorage.getItem('@snapconnect_user_data');
                        console.log('🔐 LOGIN: Raw data from AsyncStorage:', persistedUserData ? 'Found data' : 'No data');
                        
                        if (persistedUserData) {
                          // Use existing persisted user data (preserves snap score!)
                          console.log('🔐 LOGIN: Found existing user data in AsyncStorage');
                          const existingUser = JSON.parse(persistedUserData);
                          console.log('🔄 LOGIN: Parsed existing user - Snap Score:', existingUser.snapScore, 'User ID:', existingUser.id);
                          const restoredUser = {
                            ...existingUser,
                            createdAt: new Date(existingUser.createdAt),
                            updatedAt: new Date(existingUser.updatedAt),
                          };
                          console.log('🔐 LOGIN: Calling setUser with existing data...');
                          setUser(restoredUser);
                          console.log('✅ LOGIN: Successfully restored existing user');
                        } else {
                          // Create new demo user only if none exists - start with 0 snap score
                          console.log('🔐 LOGIN: No existing user found, creating new demo user');
                          console.log('✨ LOGIN: Creating brand new demo user with 0 snap score');
                          const demoUser = {
                            id: 'demo-user',
                            email: 'demo@snapconnect.app',
                            username: 'SnapDemo',
                            displayName: 'Demo User',
                            bio: 'Exploring SnapConnect! 🎉',
                            snapScore: 0, // Start with 0, will grow with activity
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
                            avatarEmoji: '😎', // Default avatar
                            streakEmoji: '🔥', // Default streak emoji
                            createdAt: new Date(),
                            updatedAt: new Date(),
                          };
                          console.log('🔐 LOGIN: Calling setUser with new demo user...');
                          setUser(demoUser); // This will persist to AsyncStorage
                          console.log('✅ LOGIN: New demo user created and saved');
                        }
                        
                        console.log('🔐 LOGIN: Setting authenticated to true...');
                        setAuthenticated(true);
                        console.log('✅ LOGIN: Login process complete!');
                      } catch (error) {
                        console.error('Error loading demo user:', error);
                        // Fallback to creating new user if there's an error
                        const demoUser = {
                          id: 'demo-user',
                          email: 'demo@snapconnect.app',
                          username: 'SnapDemo',
                          displayName: 'Demo User',
                          bio: 'Exploring SnapConnect! 🎉',
                          snapScore: 0, // Start with 0 on error fallback too
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
                        setAuthenticated(true);
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.demoText}>🎮 Try Demo Mode</Text>
          </TouchableOpacity>
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
    marginBottom: 50,
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFDD3A',
    textAlign: 'center',
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
  input: {
    backgroundColor: '#161618',
    color: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#424242',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161618',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#424242',
  },
  passwordInput: {
    flex: 1,
    color: '#FFFFFF',
    padding: 16,
    fontSize: 16,
  },
  eyeButton: {
    padding: 16,
  },
  eyeIcon: {
    fontSize: 16,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotText: {
    color: '#FFDD3A',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#FFDD3A',
    padding: 16,
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
  socialSection: {
    marginBottom: 30,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#424242',
  },
  dividerText: {
    color: '#9E9E9E',
    fontSize: 14,
    marginHorizontal: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161618',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#424242',
  },
  socialIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  socialText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
    backgroundColor: '#424242',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  demoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
}); 