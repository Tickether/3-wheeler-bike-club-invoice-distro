import express, { Express, Request, Response } from "express"
import dotenv from "dotenv"
import { getSmartWalletsPlusEmailsFromPrivyUsers } from "./utils/privy/getSmartWalletsPlusEmailsFromPrivyUsers.js"
import { attestInvoice } from "./utils/ethSign/attestInvoice.js";
import { sendEmail } from "./utils/mail/sendEmail.js";
import { deconstructAttestationData } from "./utils/ethSign/deconstructAttestationData.js";
import schedule from "node-schedule"


dotenv.config()

const app: Express = express();
const port = process.env.PORT || 8000;


app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
});
//////////////////////////////////////////////////////////////////////////////



//get all users smart wallets from privy
//send invoice attestation to all wallets...looped
//send email notifications to all emails...looped

async function attestInvoicePlusSendEmail() {
    
    const members = await getSmartWalletsPlusEmailsFromPrivyUsers()
    // Extracting smart wallet addresses
    const membersSmartWallets: string[] = members.map(member => member.smartWallet);
    //deconstruct attestation data
    const attestationData = await deconstructAttestationData(membersSmartWallets)
    //create attestation
    const attested = await attestInvoice(attestationData)
    if (attested) {
        //send email loop
        for (let i = 0; i < members.length; i++) {
            const member = members[i];
            sendEmail(member.email)
        }     
    }
}

//run function once every week
// Schedule the task to run every Monday at 8:00 AM
schedule.scheduleJob({ hour: 8, minute: 0, dayOfWeek: 1 }, function() {
    attestInvoicePlusSendEmail()
});



///////////////////////////////////////////////////////////////////////////////
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
  