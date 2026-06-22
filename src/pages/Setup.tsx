import { Alert, KeyboardAvoidingView, StyleSheet, TextInput, View } from 'react-native';
import { DEFAULT_LOCATION, tryGetCurrentPosition } from '../utils/location';
import MapView, { LatLng, MapPressEvent, Marker, PoiClickEvent, Region } from 'react-native-maps';
import React, { useContext, useEffect, useState } from 'react';

import { AuthenticationContext } from '../context/AuthenticationContext';
import BigButton from '../components/BigButton';
import Spinner from 'react-native-loading-spinner-overlay';
import { StackScreenProps } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';
import { getUserInfo as getGitHubUserInfo } from '../services/github';
import { postUser } from '../services/users';

export default function Setup({ navigation }: StackScreenProps<any>) {
    const authenticationContext = useContext(AuthenticationContext);
    const [username, setUsername] = useState('');
    const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

    const [markerLocation, setMarkerLocation] = useState<LatLng>(DEFAULT_LOCATION);
    const [currentRegion, setCurrentRegion] = useState<Region>({
        ...DEFAULT_LOCATION,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
    });

    useEffect(() => {
        setMarkerLocation(DEFAULT_LOCATION);
        setCurrentRegion({
            ...DEFAULT_LOCATION,
            latitudeDelta: 0.004,
            longitudeDelta: 0.004,
        });
    }, []);

    function handleMapPress(event: MapPressEvent | PoiClickEvent): void {
        setMarkerLocation(event.nativeEvent.coordinate);
    }

    async function handleSignUp(): Promise<void> {
        const cleanedUsername = username.trim();

        if (!cleanedUsername) {
            Alert.alert('Error', 'Insert your GitHub username');
            return;
        }

        setIsAuthenticating(true);

        try {
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject('Request timed out'), 8000)
            );

            const fromGitHub: any = await Promise.race([
                getGitHubUserInfo(cleanedUsername),
                timeout,
            ]);

            try {
                await postUser({
                    login: fromGitHub.login,
                    avatar_url: fromGitHub.avatar_url,
                    bio: fromGitHub.bio,
                    company: fromGitHub.company,
                    name: fromGitHub.name || fromGitHub.login,
                    coordinates: markerLocation,
                });
            } catch (error) {
                console.log('Backend save failed:', error);
            }

            authenticationContext?.setValue(fromGitHub.login);
            navigation.replace('Main');
        } catch (err) {
            Alert.alert('Error', String(err));
        } finally {
            setIsAuthenticating(false);
        }
    }

    return (
        <>
            <StatusBar style="dark" />
            <View testID="setup-screen" style={styles.container}>
                <MapView
                    onPress={handleMapPress}
                    onPoiClick={handleMapPress}
                    initialRegion={currentRegion}
                    style={styles.map}
                    showsUserLocation={true}
                    showsMyLocationButton={false}
                    toolbarEnabled={false}
                    showsIndoors={false}
                    mapType="mutedStandard"
                    mapPadding={{ top: 0, right: 24, bottom: 128, left: 24 }}
                >
                    <Marker coordinate={markerLocation} />
                </MapView>

                <KeyboardAvoidingView style={styles.form} behavior="position">
                    <TextInput
                        testID="input"
                        style={styles.input}
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder="Insert your GitHub username"
                        value={username}
                        onChangeText={setUsername}
                    />

                    <BigButton testID="button" onPress={handleSignUp} label="Sign Up" color="#031A62" />
                </KeyboardAvoidingView>
            </View>

            <Spinner
                visible={isAuthenticating}
                textContent="Authenticating..."
                overlayColor="#031A62BF"
                textStyle={styles.spinnerText}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        ...StyleSheet.absoluteFill,
    },
    form: {
        position: 'absolute',
        right: 0,
        left: 0,
        bottom: 0,
        padding: 24,
    },
    spinnerText: {
        fontSize: 16,
        color: '#fff',
    },
    input: {
        backgroundColor: '#fff',
        borderColor: '#031b6233',
        borderRadius: 4,
        borderWidth: 1,
        height: 56,
        paddingVertical: 16,
        paddingHorizontal: 24,
        marginBottom: 16,
        color: '#333',
        fontSize: 16,
    },
});