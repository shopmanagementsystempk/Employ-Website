const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Set user role with custom claims
exports.setUserRole = functions.https.onCall(async (data, context) => {
  // Verify the user is authenticated and is an admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set user roles');
  }

  const { uid, role } = data;
  
  if (!uid || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'uid and role are required');
  }

  if (!['admin', 'employee'].includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid role');
  }

  try {
    // Set custom claim
    await admin.auth().setCustomUserClaims(uid, { role });
    
    // Update user document
    await admin.firestore().collection('users').doc(uid).update({
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log activity
    await admin.firestore().collection('activityLogs').add({
      action: 'update',
      userId: callerUid,
      userEmail: callerDoc.data().email,
      details: `Updated role of user ${uid} to ${role}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: context.rawRequest.ip
    });

    return { success: true, message: `User role set to ${role}` };
  } catch (error) {
    console.error('Error setting user role:', error);
    throw new functions.https.HttpsError('internal', 'Failed to set user role');
  }
});

// Log activity
exports.logActivity = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { action, details } = data;
  
  if (!action) {
    throw new functions.https.HttpsError('invalid-argument', 'action is required');
  }

  try {
    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    
    await admin.firestore().collection('activityLogs').add({
      action,
      userId: context.auth.uid,
      userEmail: userDoc.data()?.email || context.auth.token.email,
      details: details || '',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: context.rawRequest.ip
    });

    return { success: true };
  } catch (error) {
    console.error('Error logging activity:', error);
    throw new functions.https.HttpsError('internal', 'Failed to log activity');
  }
});

// Generate PDF (optional server-side PDF generation)
exports.generatePDF = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { cardData } = data;
  
  if (!cardData) {
    throw new functions.https.HttpsError('invalid-argument', 'cardData is required');
  }

  // This is a placeholder - you would use a PDF library like pdfkit or puppeteer here
  // For now, we'll return a success message
  // In production, you would generate the PDF and return it as base64 or upload to Storage
  
  return { 
    success: true, 
    message: 'PDF generation would happen here. Currently using client-side generation.' 
  };
});

// Auto-login activity
exports.onUserLogin = functions.auth.user().onCreate(async (user) => {
  try {
    await admin.firestore().collection('activityLogs').add({
      action: 'login',
      userId: user.uid,
      userEmail: user.email,
      details: 'User registered',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging user creation:', error);
  }
});

