// Project Firebase: Fish Prawn Crab 2022 Special
// Project Android: Lac Bau Cua / Purchases_2_consumable_with_Firebase_FireStore => method verifyPurchase_2()

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// vì sử dụng NodeJS thuần nên ta sử dụng exports
// nếu sử dụng thư viện "express" thì ta sử dụng "route"
exports.verifyPurchases = functions.https.onRequest((req, res) => {
        var purchaseInfo = {
                purchaseToken: req.query.purchaseToken,
                orderId: req.query.orderId,
                purchaseTime: req.query.purchaseTime,
                isValid: false
        }
        var firestore = admin.firestore();
        
        firestore.doc(`purchases/${purchaseInfo.purchaseToken}`)
            .get()
            .then(result => {
                if(result.exists){
                    res.send(purchaseInfo);
                }else{
                    purchaseInfo.isValid = true;
                    firestore.doc(`purchases/${purchaseInfo.purchaseToken}`)
                        .set(purchaseInfo)
                        .then(() => {
                            res.send(purchaseInfo);
                        })
                }
            }
        )
    }
)
