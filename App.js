import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, 
  ActivityIndicator, SafeAreaView, StatusBar, Switch, ScrollView, Linking, Image 
} from 'react-native';
import { NavigationContainer, useFocusEffect, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons'; 
import * as ImagePicker from 'expo-image-picker'; 
import api from './api';

// --- CONTEXTOS ---
const ThemeContext = createContext();
const AuthContext = createContext(); 

const lightColors = {
  primary: '#00695C', secondary: '#25D366', accent: '#1976D2', 
  background: '#F5F7FA', card: '#FFFFFF', text: '#263238', 
  textLight: '#546E7A', border: '#CFD8DC', danger: '#D32F2F', 
  inputBg: '#FFFFFF', headerText: '#FFFFFF', disabled: '#E0E0E0'
};

const darkColors = {
  primary: '#004D40', secondary: '#25D366', accent: '#4FC3F7', 
  background: '#121212', card: '#1E1E1E', text: '#ECEFF1', 
  textLight: '#B0BEC5', border: '#37474F', danger: '#EF9A9A', 
  inputBg: '#263238', headerText: '#ECEFF1', disabled: '#333333'
};

// --- UTILIDAD WHATSAPP ---
const openWhatsApp = (phoneNumber, message = '') => {
  if (!phoneNumber) { Alert.alert("Aviso", "No hay número de contacto."); return; }
  let number = phoneNumber.replace(/[^\d]/g, '');
  let url = `whatsapp://send?phone=${number}&text=${message}`;
  Linking.openURL(url).catch(() => Alert.alert("Error", "No se pudo abrir WhatsApp"));
};

const formatDate = (dateString) => {
  if(!dateString) return "N/D";
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
};

const formatTime = (dateString) => {
    if(!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- PANTALLAS ---

function LoginScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);
  const { login } = useContext(AuthContext); 
  const [email, setEmail] = useState('admin@test.com');
  const [password, setPassword] = useState('fakepassword123'); 
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await api.post('/login', { email, password });
      login(response.data); 
      navigation.replace('MainTabs');
    } catch (error) { 
        Alert.alert("Error", "Credenciales incorrectas"); 
    } 
    finally { setLoading(false); }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.primary, justifyContent: 'center' }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      <View style={styles.loginCard}>
        <View style={styles.logoCircle}><FontAwesome5 name="hospital-user" size={40} color={theme.primary} /></View>
        <Text style={[styles.title, { color: theme.primary, alignSelf: 'center', marginTop: 10 }]}>MEDISYSTEM</Text>
        <TextInput style={[styles.input, { backgroundColor: '#F5F5F5', color: '#000' }]} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none"/>
        <TextInput style={[styles.input, { backgroundColor: '#F5F5F5', color: '#000' }]} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry/>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleLogin}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>INICIAR SESIÓN</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PatientsScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { fetchPatients(); }, []));

  const fetchPatients = async () => {
    setRefreshing(true);
    try {
      const res = await api.get(`/patients?user_id=${user.user_id}`);
      setPatients(res.data);
      setFiltered(res.data);
    } catch (e) { console.error(e); } finally { setRefreshing(false); }
  };

  const handleSearch = (text) => {
    setSearch(text);
    if (text) setFiltered(patients.filter(i => i.name.toLowerCase().includes(text.toLowerCase())));
    else setFiltered(patients);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={{ padding: 15, backgroundColor: theme.primary, borderBottomRightRadius: 20 }}>
        <Text style={{color: '#FFF', fontSize: 14, marginBottom: 5}}>Dr. {user.full_name}</Text>
        <Text style={{color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 10}}>Mis Pacientes</Text>
        <View style={[styles.searchBar, { backgroundColor: theme.card }]}>
            <Ionicons name="search" size={20} color={theme.textLight} />
            <TextInput style={{ flex: 1, color: theme.text, marginLeft: 10 }} placeholder="Buscar..." placeholderTextColor={theme.textLight} value={search} onChangeText={handleSearch}/>
        </View>
      </View>
      <FlatList
        data={filtered} keyExtractor={i => i.patient_id.toString()} refreshing={refreshing} onRefresh={fetchPatients}
        contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={{textAlign:'center', marginTop:20, color: theme.textLight}}>No tienes pacientes registrados.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.patientRow, { backgroundColor: theme.card }]} onPress={() => navigation.navigate('PatientDetail', { patient: item })}>
            <View style={[styles.avatar, { backgroundColor: theme.primary + '15' }]}><Text style={{ fontSize: 18, color: theme.primary, fontWeight: 'bold' }}>{item.name.charAt(0)}</Text></View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={[styles.patientName, { color: theme.text }]}>{item.name}</Text>
              <Text style={{ color: theme.textLight, fontSize: 12 }}>Nac: {item.birth_date}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.accent }]} onPress={() => navigation.navigate('SavePatient')}>
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function SavePatientScreen({ route, navigation }) {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext); 
  const isEditing = route.params?.patient; 
  const p = route.params?.patient || {};
  const [name, setName] = useState(p.name || '');
  const [birthDate, setBirthDate] = useState(p.birth_date || '');
  const [contact, setContact] = useState(p.contact_info || '');

  const handleDateChange = (t) => {
    const c = t.replace(/[^0-9]/g, '');
    let f = c;
    if (c.length > 4) f = c.slice(0, 4) + '-' + c.slice(4);
    if (c.length > 6) f = f.slice(0, 7) + '-' + c.slice(6);
    setBirthDate(f.slice(0, 10));
  };

  const handleSave = async () => {
    if (birthDate.length !== 10) { Alert.alert("Error", "Fecha inválida (YYYY-MM-DD)"); return; }
    try {
      const payload = { name, birth_date: birthDate, contact_info: contact, user_id: user.user_id }; 
      if (isEditing) {
        await api.put(`/patients/${p.patient_id}`, payload);
        Alert.alert("Éxito", "Actualizado");
      } else {
        await api.post('/patients', payload);
        Alert.alert("Éxito", "Creado");
      }
      navigation.goBack();
    } catch (e) { Alert.alert("Error", "No se pudo guardar."); }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, padding: 20 }]}>
      <View style={[styles.formContainer, { backgroundColor: theme.card }]}>
        <Text style={[styles.label, { color: theme.textLight }]}>Nombre</Text>
        <TextInput style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]} value={name} onChangeText={setName} />
        <Text style={[styles.label, { color: theme.textLight }]}>Fecha Nacimiento (YYYY-MM-DD)</Text>
        <TextInput style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]} value={birthDate} onChangeText={handleDateChange} keyboardType="numeric" maxLength={10} />
        <Text style={[styles.label, { color: theme.textLight }]}>Teléfono</Text>
        <TextInput style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]} value={contact} onChangeText={setContact} keyboardType="phone-pad" />
      </View>
      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, marginTop: 20 }]} onPress={handleSave}>
        <Text style={styles.buttonText}>GUARDAR</Text>
      </TouchableOpacity>
    </View>
  );
}

function RegisterDoctorScreen({ navigation }) {
    const { theme } = useContext(ThemeContext);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if(!name || !email || !password) { Alert.alert("Error", "Todos los campos son obligatorios"); return; }
        setLoading(true);
        try {
            await api.post('/doctors', { full_name: name, email, password });
            Alert.alert("Éxito", "Nuevo doctor registrado.");
            navigation.goBack();
        } catch (e) { Alert.alert("Error", "No se pudo registrar."); } 
        finally { setLoading(false); }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background, padding: 20 }]}>
            <View style={[styles.formContainer, { backgroundColor: theme.card }]}>
                <Text style={{color: theme.primary, fontWeight: 'bold', marginBottom: 15}}>NUEVO USUARIO MÉDICO</Text>
                <Text style={[styles.label, { color: theme.textLight }]}>Nombre Completo</Text>
                <TextInput style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]} value={name} onChangeText={setName} />
                <Text style={[styles.label, { color: theme.textLight }]}>Correo Electrónico</Text>
                <TextInput style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"/>
                <Text style={[styles.label, { color: theme.textLight }]}>Contraseña</Text>
                <TextInput style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]} value={password} onChangeText={setPassword} />
            </View>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, marginTop: 20 }]} onPress={handleRegister}>
                {loading ? <ActivityIndicator color="#FFF"/> : <Text style={styles.buttonText}>CREAR DOCTOR</Text>}
            </TouchableOpacity>
        </View>
    );
}

function SaveRecordScreen({ route, navigation }) {
    const { theme } = useContext(ThemeContext);
    const { patientId, record } = route.params; 
    
    const [notes, setNotes] = useState(record ? record.notes : '');
    const [weight, setWeight] = useState(record ? String(record.weight_kg) : '');
    const [bp, setBp] = useState(record ? record.blood_pressure : '');
    const [treatment, setTreatment] = useState(record ? record.treatment : ''); 
    const [photo, setPhoto] = useState(record ? record.photo_url : null);
    
    const [permission, requestPermission] = ImagePicker.useCameraPermissions();

    const takePhoto = async () => {
        if (!permission?.granted) {
            const response = await requestPermission();
            if (!response.granted) { Alert.alert("Permiso", "Se requiere cámara"); return; }
        }
        const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.5 });
        if (!result.canceled) { setPhoto(result.assets[0].uri); }
    };

    const save = async () => {
        if(!notes || !weight || !bp) { Alert.alert("Campos incompletos", "Por favor llena Observaciones, Peso y Presión."); return; }
        const data = { notes, weight_kg: parseFloat(weight)||0, blood_pressure: bp, treatment, photo_url: photo }; 

        try {
            if(record) { 
                await api.put(`/medical_records/${record.record_id}`, data);
                Alert.alert("Actualizado", "Nota modificada.");
            } else { 
                await api.post(`/patients/${patientId}/records`, data);
                Alert.alert("Guardado", "Nota agregada.");
            }
            navigation.goBack();
        } catch (e) { Alert.alert("Error", "No se pudo guardar."); }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={{ padding: 20 }}>
                <View style={[styles.formContainer, { backgroundColor: theme.card }]}>
                    <Text style={{color: theme.primary, fontWeight: 'bold', marginBottom: 15}}>
                        {record ? "EDITAR OBSERVACIÓN" : "OBSERVACIONES MÉDICAS"}
                    </Text>
                    <Text style={[styles.label, { color: theme.textLight }]}>Descripción Clínica *</Text>
                    <TextInput style={[styles.inputArea, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} multiline value={notes} onChangeText={setNotes} placeholder="Describa síntomas y diagnóstico..."/>
                    <View style={{ flexDirection: 'row', marginTop: 15 }}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={[styles.label, { color: theme.textLight }]}>Peso (kg) *</Text>
                            <TextInput style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]} keyboardType="numeric" value={weight} onChangeText={setWeight} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: theme.textLight }]}>Presión (mmHg) *</Text>
                            <TextInput style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]} value={bp} onChangeText={setBp} placeholder="120/80" placeholderTextColor={theme.textLight}/>
                        </View>
                    </View>
                    <Text style={[styles.label, { color: theme.textLight, marginTop: 15 }]}>Tratamiento / Receta</Text>
                    <TextInput style={[styles.inputArea, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, height: 80 }]} multiline value={treatment} onChangeText={setTreatment} placeholder="Medicamentos y dosis..."/>
                    <Text style={[styles.label, { color: theme.textLight, marginTop: 20 }]}>Evidencia Fotográfica (Opcional)</Text>
                    {photo ? (
                        <View style={{ alignItems: 'center', marginTop: 10 }}>
                            <Image source={{ uri: photo }} style={{ width: 200, height: 200, borderRadius: 10, marginBottom: 10 }} />
                            <TouchableOpacity onPress={() => setPhoto(null)}><Text style={{ color: theme.danger, fontWeight: 'bold' }}>Eliminar Foto</Text></TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderWidth: 1, borderColor: theme.border, borderRadius: 10, borderStyle: 'dashed', marginTop: 10 }} onPress={takePhoto}>
                            <Ionicons name="camera" size={24} color={theme.textLight} />
                            <Text style={{ color: theme.textLight, marginLeft: 10 }}>Tomar Foto</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, marginTop: 20 }]} onPress={save}>
                    <Text style={styles.buttonText}>GUARDAR OBSERVACIÓN</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

// --- EDICIÓN DE CITA (DOCTOR AUTOMÁTICO Y BLOQUEADO) ---
function SaveAppointmentScreen({ route, navigation }) {
    const { theme } = useContext(ThemeContext);
    const { user } = useContext(AuthContext); // Obtenemos el usuario actual
    const { patientId, appointment, contactInfo, patientName } = route.params; 
    
    const initDate = appointment ? appointment.appointment_date.split('T')[0] : '';
    const initTime = appointment ? appointment.appointment_date.split('T')[1].substring(0,5) : '';

    const [date, setDate] = useState(initDate);
    const [time, setTime] = useState(initTime);
    const [reason, setReason] = useState(appointment ? appointment.reason : '');
    // El doctor ahora es fijo, basado en el usuario logueado
    const doctor = user.full_name; 

    const handleDateChange = (t) => {
        const c = t.replace(/[^0-9]/g, ''); let f = c;
        if (c.length > 4) f = c.slice(0, 4) + '-' + c.slice(4);
        if (c.length > 6) f = f.slice(0, 7) + '-' + c.slice(6);
        setDate(f.slice(0, 10));
    };
    const handleTimeChange = (t) => {
         const c = t.replace(/[^0-9]/g, ''); let f = c;
         if (c.length > 2) f = c.slice(0, 2) + ':' + c.slice(2);
         setTime(f.slice(0, 5));
    };

    const save = async () => {
        if(date.length !== 10 || time.length !== 5) { Alert.alert("Error", "Formato fecha/hora inválido"); return; }
        const isoDateTime = `${date}T${time}:00`;
        const data = { patient_id: patientId, appointment_date: isoDateTime, reason, doctor_name: doctor };

        try {
            if(appointment) { 
                 await api.put(`/appointments/${appointment.appointment_id}`, data);
            } else { 
                 await api.post('/appointments', data);
            }
            
            Alert.alert(
                "Cita Guardada",
                "¿Desea enviar un recordatorio al paciente por WhatsApp?",
                [
                    { text: "No", onPress: () => navigation.goBack() },
                    { text: "Sí, Enviar", onPress: () => {
                        const msg = `Hola ${patientName || 'Paciente'}, le recuerdo su cita médica el ${date} a las ${time} hrs con el ${doctor}. Motivo: ${reason}. Saludos.`;
                        openWhatsApp(contactInfo, msg);
                        navigation.goBack();
                    }}
                ]
            );

        } catch (e) { Alert.alert("Error", "No se pudo guardar."); }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background, padding: 20 }]}>
            <View style={[styles.formContainer, { backgroundColor: theme.card }]}>
                <Text style={{color: theme.accent, fontWeight: 'bold', marginBottom: 15}}>{appointment ? "EDITAR CITA" : "AGENDAR CITA"}</Text>
                <View style={{flexDirection:'row'}}>
                    <View style={{flex:1, marginRight:10}}>
                        <Text style={[styles.label, {color:theme.textLight}]}>Fecha (YYYY-MM-DD)</Text>
                        <TextInput style={[styles.input, {color:theme.text, borderBottomColor:theme.border}]} value={date} onChangeText={handleDateChange} keyboardType="numeric" maxLength={10}/>
                    </View>
                    <View style={{flex:1}}>
                         <Text style={[styles.label, {color:theme.textLight}]}>Hora (HH:MM)</Text>
                         <TextInput style={[styles.input, {color:theme.text, borderBottomColor:theme.border}]} value={time} onChangeText={handleTimeChange} keyboardType="numeric" maxLength={5}/>
                    </View>
                </View>
                <Text style={[styles.label, {color:theme.textLight}]}>Motivo</Text>
                <TextInput style={[styles.input, {color:theme.text, borderBottomColor:theme.border}]} value={reason} onChangeText={setReason} />
                
                {/* CAMPO DOCTOR BLOQUEADO */}
                <Text style={[styles.label, {color:theme.textLight}]}>Doctor Asignado</Text>
                <TextInput 
                    style={[styles.input, {color: theme.textLight, borderBottomColor: theme.border, backgroundColor: theme.disabled }]} 
                    value={doctor} 
                    editable={false} // BLOQUEADO
                />
            </View>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent, marginTop: 20 }]} onPress={save}>
                <Text style={styles.buttonText}>GUARDAR Y NOTIFICAR</Text>
            </TouchableOpacity>
        </View>
    );
}

function PatientDetailScreen({ route, navigation }) {
  const { theme } = useContext(ThemeContext);
  const { patient } = route.params;
  const [tab, setTab] = useState('notes'); 
  const [records, setRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useFocusEffect(useCallback(() => { fetchRecords(); fetchAppointments(); }, [patient.patient_id]));

  const fetchRecords = async () => { try { const res = await api.get(`/patients/${patient.patient_id}/records`); setRecords(res.data); } catch (e) {} };
  const fetchAppointments = async () => { try { const res = await api.get(`/appointments`); setAppointments(res.data.filter(a => a.patient_id === patient.patient_id)); } catch (e) {} };

  const deleteRecord = (id) => {
    Alert.alert("Eliminar", "¿Borrar esta entrada?", [
        { text: "No" }, { text: "Sí", style: 'destructive', onPress: async () => { await api.delete(`/medical_records/${id}`); fetchRecords(); } }
    ]);
  };

  const deleteAppointment = (id) => {
    Alert.alert("Cancelar", "¿Cancelar esta cita?", [
        { text: "No" }, { text: "Sí", style: 'destructive', onPress: async () => { await api.delete(`/appointments/${id}`); fetchAppointments(); } }
    ]);
  };

  const confirmDeletePatient = () => {
    Alert.alert("Eliminar Paciente", "Se borrará todo el expediente.", [
        { text: "No" }, { text: "Sí", style: 'destructive', onPress: async () => { await api.delete(`/patients/${patient.patient_id}`); navigation.popToTop(); } }
    ]);
  };

  const renderContent = () => {
    if (tab === 'notes') {
        return (
            <FlatList
                data={records} keyExtractor={i => i.record_id.toString()} contentContainerStyle={{ padding: 15 }}
                ListEmptyComponent={<Text style={{textAlign:'center', color: theme.textLight, marginTop:20}}>Sin observaciones.</Text>}
                renderItem={({ item }) => (
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ alignItems: 'center', width: 40 }}>
                        <View style={{ width: 2, height: '100%', backgroundColor: theme.border }} />
                        <View style={{ position: 'absolute', top: 15, width: 10, height: 10, borderRadius: 5, backgroundColor: theme.primary }} />
                    </View>
                    <View style={[styles.clinicalCard, { backgroundColor: theme.card, flex: 1, marginBottom: 15 }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: theme.textLight, fontSize: 12 }}>{formatDate(item.record_date)}</Text>
                            <View style={{flexDirection:'row'}}>
                                <TouchableOpacity onPress={() => navigation.navigate('SaveRecord', { patientId: patient.patient_id, record: item })} style={{marginRight:10}}>
                                    <Ionicons name="pencil" size={18} color={theme.textLight}/>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => deleteRecord(item.record_id)}>
                                    <Ionicons name="trash-outline" size={18} color={theme.danger}/>
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        {item.photo_url && (
                             <Image source={{ uri: item.photo_url }} style={{ width: '100%', height: 150, borderRadius: 8, marginTop: 10, marginBottom: 5 }} resizeMode="cover" />
                        )}

                        <Text style={[styles.noteText, { color: theme.text, marginVertical: 8 }]}>{item.notes}</Text>
                        {item.treatment ? (
                            <View style={{ backgroundColor: theme.secondary + '10', padding: 10, borderRadius: 8, marginTop: 5, flexDirection:'row' }}>
                                <FontAwesome5 name="pills" size={16} color={theme.secondary} style={{marginTop:3}} />
                                <Text style={{ marginLeft: 10, color: theme.text, flex: 1 }}>{item.treatment}</Text>
                            </View>
                        ) : null}
                        <View style={[styles.vitalsGrid, { backgroundColor: theme.background, marginTop: 10 }]}>
                            <View style={styles.vitalItem}><MaterialCommunityIcons name="scale-bathroom" size={16} color={theme.textLight} /><Text style={{ fontWeight: 'bold', color: theme.text, marginLeft: 5 }}>{item.weight_kg} kg</Text></View>
                            <View style={styles.vitalItem}><MaterialCommunityIcons name="heart-pulse" size={16} color={theme.danger} /><Text style={{ fontWeight: 'bold', color: theme.text, marginLeft: 5 }}>{item.blood_pressure}</Text></View>
                        </View>
                    </View>
                </View>
                )}
            />
        );
    } else if (tab === 'appointments') {
        return (
            <FlatList
                data={appointments} keyExtractor={i => i.appointment_id.toString()} contentContainerStyle={{ padding: 15 }}
                ListEmptyComponent={<Text style={{textAlign:'center', color: theme.textLight, marginTop:20}}>Sin citas.</Text>}
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: theme.card, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: theme.accent }]}>
                        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                            <View>
                                <Text style={{fontSize: 16, fontWeight:'bold', color: theme.text}}>{formatDate(item.appointment_date)} - {formatTime(item.appointment_date)} hrs</Text>
                                <Text style={{color: theme.textLight}}>{item.reason}</Text>
                                <Text style={{fontSize:12, color: theme.textLight, fontStyle:'italic'}}>{item.doctor_name}</Text>
                            </View>
                            <View style={{flexDirection:'row'}}>
                                <TouchableOpacity onPress={() => navigation.navigate('SaveAppointment', { patientId: patient.patient_id, appointment: item })} style={{marginRight:15}}>
                                    <Ionicons name="pencil" size={20} color={theme.textLight}/>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => deleteAppointment(item.appointment_id)}>
                                    <Ionicons name="trash-outline" size={20} color={theme.danger}/>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            />
        );
    }
    return null;
  };

  const renderFab = () => {
      if (tab === 'notes') {
          return <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }]} onPress={() => navigation.navigate('SaveRecord', { patientId: patient.patient_id })}><MaterialCommunityIcons name="stethoscope" size={28} color="#FFF" /></TouchableOpacity>;
      } else if (tab === 'appointments') {
          return <TouchableOpacity style={[styles.fab, { backgroundColor: theme.accent }]} onPress={() => navigation.navigate('SaveAppointment', { patientId: patient.patient_id, contactInfo: patient.contact_info, patientName: patient.name })}><Ionicons name="calendar" size={28} color="#FFF" /></TouchableOpacity>;
      }
      return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.clinicalHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <View>
                <Text style={[styles.clinicalName, { color: theme.text }]}>{patient.name}</Text>
                <Text style={{ color: theme.textLight, marginTop: 4 }}>Fecha de Nacimiento: {patient.birth_date}</Text>
            </View>
            <View style={{flexDirection: 'row'}}>
                <TouchableOpacity onPress={() => navigation.navigate('SavePatient', { patient })} style={styles.iconBtn}><Ionicons name="pencil" size={20} color={theme.textLight} /></TouchableOpacity>
                <TouchableOpacity onPress={confirmDeletePatient} style={styles.iconBtn}><Ionicons name="trash-outline" size={20} color={theme.danger} /></TouchableOpacity>
            </View>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 15 }}>
             <TouchableOpacity style={[styles.actionChip, { borderColor: theme.secondary }]} onPress={() => openWhatsApp(patient.contact_info, `Hola ${patient.name}.`)}>
                <Ionicons name="logo-whatsapp" size={16} color={theme.secondary} />
                <Text style={{ color: theme.secondary, fontWeight: 'bold', marginLeft: 5 }}>WhatsApp</Text>
             </TouchableOpacity>
             <Text style={{marginLeft: 10, alignSelf:'center', color: theme.textLight}}>{patient.contact_info}</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        {['notes', 'appointments'].map((t) => (
            <TouchableOpacity key={t} style={[styles.tabButton, tab === t && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]} onPress={() => setTab(t)}>
                <Text style={{ color: tab === t ? theme.primary : theme.textLight, fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {t === 'notes' ? 'Historial' : 'Citas'}
                </Text>
            </TouchableOpacity>
        ))}
      </View>
      <View style={{flex: 1}}>{renderContent()}</View>
      {renderFab()}
    </View>
  );
}

function ProfileScreen({ navigation }) {
    const { theme, isDark, toggleTheme } = useContext(ThemeContext);
    const { user, logout } = useContext(AuthContext); 

    const handleLogout = () => {
        logout();
        navigation.replace('Login');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background, padding: 20 }]}>
            <View style={[styles.card, { backgroundColor: theme.card, padding: 20, flexDirection: 'row', alignItems: 'center' }]}>
                <View style={[styles.avatar, { width: 60, height: 60, borderRadius: 30, backgroundColor: theme.primary }]}>
                     <Text style={{color: '#fff', fontSize: 24}}>DR</Text>
                </View>
                <View style={{marginLeft: 15}}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>{user.full_name}</Text>
                    <Text style={{ color: theme.textLight, textTransform: 'capitalize' }}>Rol: {user.role}</Text>
                </View>
            </View>
            <View style={[styles.card, { backgroundColor: theme.card, marginTop: 20, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Ionicons name={isDark ? "moon" : "sunny"} size={24} color={theme.text} style={{ marginRight: 15 }} />
                    <Text style={{ color: theme.text, fontSize: 16 }}>Tema Oscuro</Text>
                </View>
                <Switch value={isDark} onValueChange={toggleTheme} trackColor={{false: "#767577", true: theme.primary}} />
            </View>

            {user.role === 'admin' && (
                <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent, marginTop: 20 }]} onPress={() => navigation.navigate('RegisterDoctor')}>
                    <Text style={styles.buttonText}>REGISTRAR NUEVO DOCTOR</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.button, { backgroundColor: theme.danger, marginTop: 20 }]} onPress={handleLogout}>
                <Text style={styles.buttonText}>CERRAR SESIÓN</Text>
            </TouchableOpacity>
        </View>
    );
}

const PatientStack = createNativeStackNavigator();
function PatientNavigator() {
    const { theme } = useContext(ThemeContext);
    return (
        <PatientStack.Navigator 
            initialRouteName="PatientsList"
            screenOptions={{ headerStyle: { backgroundColor: theme.primary }, headerTintColor: theme.headerText, headerTitleStyle: { fontWeight: '600' }, headerBackTitleVisible: false }}
        >
            <PatientStack.Screen name="PatientsList" component={PatientsScreen} options={{ headerShown: false }} />
            <PatientStack.Screen name="SavePatient" component={SavePatientScreen} options={{ title: 'Datos del Paciente' }} />
            <PatientStack.Screen name="PatientDetail" component={PatientDetailScreen} options={{ title: 'Expediente Clínico' }} />
            <PatientStack.Screen name="SaveRecord" component={SaveRecordScreen} options={{ title: 'Nota Clínica' }} />
            <PatientStack.Screen name="SaveAppointment" component={SaveAppointmentScreen} options={{ title: 'Gestión de Cita', headerStyle: { backgroundColor: theme.accent } }} />
            <PatientStack.Screen name="RegisterDoctor" component={RegisterDoctorScreen} options={{ title: 'Alta de Médico' }} />
        </PatientStack.Navigator>
    );
}

function MainTabs() {
    const { theme } = useContext(ThemeContext);
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false, 
                tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border, height: 60, paddingBottom: 5 },
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.textLight,
                tabBarIcon: ({ color, size }) => {
                    let iconName;
                    if (route.name === 'PacientesTab') iconName = 'people';
                    else if (route.name === 'Perfil') iconName = 'settings-sharp';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="PacientesTab" component={PatientNavigator} options={{ title: 'Pacientes' }} />
            <Tab.Screen name="Perfil" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const theme = isDark ? darkColors : lightColors;
  const toggleTheme = () => setIsDark(!isDark);
  
  const [user, setUser] = useState(null); 
  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      <AuthContext.Provider value={{ user, login, logout }}>
        <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="RegisterDoctor" component={RegisterDoctorScreen} options={{ title: 'Alta de Médico' }}/> 
          </Stack.Navigator>
        </NavigationContainer>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loginCard: { margin: 30, padding: 30, backgroundColor: '#FFF', borderRadius: 20, alignItems: 'center', elevation: 10 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  subtitle: { fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' },
  input: { width: '100%', paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#CFD8DC', marginBottom: 20, fontSize: 16 },
  inputArea: { width: '100%', padding: 15, borderRadius: 10, borderWidth: 1, height: 120, textAlignVertical: 'top', fontSize: 16 },
  button: { width: '100%', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10, shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2 },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, marginTop: 10 },
  patientRow: { flexDirection: 'row', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center', borderBottomWidth: 1, elevation: 1 },
  avatar: { width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  patientName: { fontSize: 16, fontWeight: 'bold' },
  clinicalHeader: { padding: 20, borderBottomWidth: 1, paddingBottom: 25 },
  clinicalName: { fontSize: 24, fontWeight: 'bold' },
  iconBtn: { marginLeft: 15, padding: 5 },
  actionChip: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: 'transparent', alignItems: 'center' },
  clinicalCard: { padding: 15, borderRadius: 8, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#00695C' },
  vitalsGrid: { flexDirection: 'row', padding: 10, borderRadius: 8, marginBottom: 10, alignItems: 'center', justifyContent: 'space-around' },
  vitalItem: { flexDirection: 'row', alignItems: 'center' },
  noteText: { fontSize: 15, lineHeight: 22 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  formContainer: { borderRadius: 12, padding: 20 },
  label: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 5, marginTop: 10 },
  card: { borderRadius: 12, elevation: 2, padding: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', backgroundColor: 'transparent' },
  tabButton: { flex: 1, padding: 15, alignItems: 'center' },
});