// Project Firebase: Fish Prawn Crab 2022 Special
// Project Android: Lac Bau Cua / Purchases_2_consumable_with_Firebase_FireStore => method verifyPurchase_2()

const functions = require("firebase-functions");
const { google } = require("googleapis");
const admin = require("firebase-admin");
admin.initializeApp();
const firestore = admin.firestore();


const PATH_TO_PRIVATE_KEY_FILE = "./service-account--google-play-console-developer-api-8495659346553641446-739.json";
const SCOPES = ['https://www.googleapis.com/auth/androidpublisher'];

const play = google.androidpublisher("v3");
const authClient = new google.auth.GoogleAuth({
    keyFile: PATH_TO_PRIVATE_KEY_FILE,
    scopes: SCOPES
});
let MY_COLLECTION = "";
let docRef;

// vì sử dụng NodeJS thuần nên ta sử dụng exports
// nếu sử dụng thư viện "express" thì ta sử dụng "route"
exports.consume = functions
    .region('us-central1')
    .https.onRequest((req, res) => {
        console.log('LINE 20 - purchaseToken: ' +req.query.purchaseToken);
        MY_COLLECTION = req.query.isTest
                                ? 'test_consume_purchases_FishPrawnCrab2022Special'
                                : 'consume_purchases_FishPrawnCrab2022Special';
        docRef = firestore.doc(`${MY_COLLECTION}/${req.query.purchaseToken}`);
        docRef
            .get()
            .then(data => {
                if(data.exists){
                    docRef
                        .update({consumptionState: 1})
                        .then(() => {
                            console.log("UPDATE SUCCESSFUL");
                            res.json({message: 'UPDATE SUCCESSFUL'});
                        })
                        .catch(e => console.log("LINE 42: " +e));
                }
            })
            .catch(e => console.log("LINE 45: " +e));
    });

exports.validate = functions
    .region("us-central1")
    .https.onRequest((req, res) => {
        MY_COLLECTION = req.query.isTest
                                ? 'test_consume_purchases_FishPrawnCrab2022Special'
                                : 'consume_purchases_FishPrawnCrab2022Special';
        let purchaseRes = {
            packageName: req.query.packageName,
            productId: req.query.productId,
            purchaseToken: req.query.purchaseToken,
            isValid: false
        };
        console.log('LINE 60:');
        console.table(purchaseRes);

        // FIREBASE FILESTORE
        docRef = firestore.doc(`${MY_COLLECTION}/${req.query.purchaseToken}`);
        docRef
            .get()
            .then(result => {
                if (result.exists) {
                    // Handling ...
                    console.log('LINE 70: DOC IS EXISTS');
                    res.send(purchaseRes);
                } else {
                    console.log('LINE 73: DOC IS NOT EXISTS');
                    // Tạo một đối tượng client với thông tin xác thực của bạn
                    _verifyPurchases(purchaseRes)
                        .then(data => {
                            console.log("LINE 70: " +data.data);
                            purchaseRes.isValid = true;

                            _acknowledge(purchaseRes)
                                .then(() => {
                                    console.log('LINE 82:\nTHE PURCHASE HAS BEEN ACKNOWLEDGED')

                                    _storeToDB(purchaseRes)
                                        .then(() => console.log('LINE 85:\nYOUR DATA HAS BEEN SUCCESSFUL SAVED'))
                                        .catch(e => {
                                            console.log('LINE 87: ' +e);
                                            res.json(e);
                                        });

                                    res.json(purchaseRes);
                                })
                                .catch(e => {
                                    console.log('LINE 97: ' +e)
                                    res.json(e);
                                });
                        })
                        .catch(e => {
                            console.log('LINE 102: ' +e);
                            purchaseRes.isValid = false;
                            purchaseRes.error = e;
                            res.json(purchaseRes);
                        });
                }
            });
    });

/**
 * 
 * @param {*} purchaseRes 
 * @param {*} authClient 
 * @param {*} play 
 * @returns {
*      ...
*      data: {
*          purchaseTimeMillis: '1679286115763',
*          purchaseState: 0,
*          consumptionState: 0,
*          developerPayload: '',
*          orderId: 'GPA.3378-5247-2907-89543',
*          purchaseType: 0,
*          acknowledgementState: 1,
*          kind: 'androidpublisher#productPurchase',
*          regionCode: 'VN'
*      }
*  }
*/
function _verifyPurchases(purchaseRes) {
    return play.purchases.products.get({
        packageName: purchaseRes.packageName,
        productId: purchaseRes.productId,
        token: purchaseRes.purchaseToken,
        auth: authClient,
    });
}

function _acknowledge(purchaseRes) {
    return play.purchases.products.acknowledge({
        packageName: purchaseRes.packageName,
        productId: purchaseRes.productId,
        token: purchaseRes.purchaseToken,
        auth: authClient,
    });
}

async function _storeToDB(purchaseRes) {
    _verifyPurchases(purchaseRes, authClient, play)
        .then(data => {
            return docRef.set({
                packageName: purchaseRes.packageName,
                productId: purchaseRes.productId,
                purchaseToken: purchaseRes.purchaseToken,
                isValid: purchaseRes.isValid,

                purchaseTimeMillis: data.data.purchaseTimeMillis,
                purchaseState: data.data.purchaseState,
                consumptionState: data.data.consumptionState,
                orderId: data.data.orderId,
                purchaseType: data.data.purchaseType,
                acknowledgementState: data.data.acknowledgementState,
                kind: data.data.kind,
                regionCode: data.data.regionCode,
                obfuscatedExternalAccountId: data.data.obfuscatedExternalAccountId || "_",
                obfuscatedExternalProfileId: data.data.obfuscatedExternalProfileId || "_",

            })
        })
        .catch(e => console.log('LINE 161: ' + e));
}