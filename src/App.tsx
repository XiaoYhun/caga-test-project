import { useEffect, useRef, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Web3 from "web3";
import useSWR from "swr";

const web3 = new Web3("https://mainnet.infura.io/v3/69942ae7ac7641fcb46092c7850779b7");

const useETHBalances = (address?: string) => {
  const { data, error, isLoading } = useSWR(address ? [address, "balance"] : null, async () => {
    if (!address) return;
    return web3.eth.getBalance(address);
  });
  return {
    balance: data,
    isLoading,
    error,
  };
};

const useUSDTBalances = (address?: string) => {
  const { data, error, isLoading } = useSWR(address ? [address, "usdtBalance"] : null, async () => {
    if (!address) return;
    const contract = new web3.eth.Contract(
      [
        {
          constant: true,
          inputs: [{ name: "_owner", type: "address" }],
          name: "balanceOf",
          outputs: [{ name: "balance", type: "uint256" }],
          payable: false,
          stateMutability: "view",
          type: "function",
        },
        {
          constant: true,
          inputs: [],
          name: "decimals",
          outputs: [
            {
              name: "",
              type: "uint8",
            },
          ],
          payable: false,
          type: "function",
        },
      ],
      "0xdac17f958d2ee523a2206206994597c13d831ec7"
    );

    const [balance, decimals]: [any, any] = await Promise.all([
      contract.methods.balanceOf(address).call(),
      contract.methods.decimals().call(),
    ]);

    return Number(balance) / 10 ** Number(decimals);
  });
  return {
    balance: data,
    isLoading,
    error,
  };
};

function App() {
  const metamaskConnected = useRef(false);
  const [account, setAccount] = useState("");
  const { balance: ETHBalance, isLoading: isETHBalanceLoading } = useETHBalances(account);
  const { balance: USDTBalance, isLoading: isUSDTBalanceLoading } = useUSDTBalances(account);

  const connectWallet = async () => {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      if (accounts.length) {
        setAccount(accounts[0]);
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (window.ethereum && window.ethereum.isMetaMask) {
      metamaskConnected.current = true;
      window.ethereum.on("accountsChanged", function (accounts: string[]) {
        console.log("🚀 ~ accounts:", accounts);
        if (accounts.length) {
          setAccount(accounts[0]);
        }
      });
    } else {
    }
  }, []);
  return (
    <>
      <div className="flex justify-center gap-4">
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <div className="card">
        {account ? (
          <div className="flex flex-col gap-2 rounded-lg !bg-black items-start p-3">
            <div>
              <span className="text-gray-500">Wallet Address:</span>{" "}
              <span className="font-semibold">{web3.utils.toChecksumAddress(account)}</span>{" "}
            </div>
            <div>
              <span className="text-gray-500">ETH Balance: </span>
              <span className="font-semibold">
                {isETHBalanceLoading ? "Loading..." : web3.utils.fromWei(ETHBalance || 0n, "ether") + " ETH"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">USDT Balance: </span>
              <span className="font-semibold">
                {isUSDTBalanceLoading ? "Loading..." : (USDTBalance || "0") + " USDT"}
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              metamaskConnected.current && connectWallet();
            }}
          >
            {metamaskConnected.current ? "No metamask detected" : "Connect to Metamask"}
          </button>
        )}
      </div>
    </>
  );
}

export default App;
