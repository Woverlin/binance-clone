import { memo, useEffect, useState } from "react";
import HomeView from "./HomeView";
import STORE_KEYS from "../../utils/constant";
import { useMutation, useQuery } from "react-query";
import API from "../../api/api";
import { ISymbol } from "../../interface";
import variables from "../../api/variable";
import { inflate } from "pako";
import { toast } from "react-toastify";
import allSymbolData from "../../utils/allSymbol";
import { delay, floored_val, separatedArray, generateRandomPrice } from "../../utils/helper";

let ws: any;
let preSymbol: any = null;
const numDecimalDigits = 4;
const itemsPerBatch = 10;

const defaultUserInfo = {
  AccessKeyId: "",
  secretKey: "",
  userId: "",
  balances: [],
};

const Home = () => {
  const [searchValue, setSearchValue] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState<ISymbol>();
  const [ordersBook, setOrdersBook] = useState({});
  const [buyer, setBuyer] = useState({ ...defaultUserInfo });
  const [seller, setSeller] = useState({ ...defaultUserInfo });
  const [userId, setUserId] = useState("");
  const [userSelectedInfo, setUserSelectedInfo] = useState({ ...defaultUserInfo });
  const [createVolLoading, setCreateVolLoading] = useState(false)
  useEffect(() => {

    initSocket();
    getUserInfo();
  }, []);

  const [buyForm, setBuyForm] = useState({
    price: 0,
    amount: 0,
  });

  const [sellForm, setSellForm] = useState({
    price: 0,
    amount: 0,
  });

  const [sellBatchForm, setSellBatchForm] = useState({
    min: 0,
    max: 0,
    amountPerPrice: 0,
    step: 0,
  });

  const [createVolumeForm, setCreateVolumeForm] = useState({
    min: 0,
    max: 0,
    count: 0,
    desiredVolume: 0
  });
  const getUserInfo = () => {

    const buyer = JSON.parse(sessionStorage.getItem(STORE_KEYS.BUYER) || "{}");
    const seller = JSON.parse(sessionStorage.getItem(STORE_KEYS.SELLER) || "{}");

    // const secretKey = sessionStorage.getItem(STORE_KEYS.secretKey);
    if (buyer?.userId) {
      _onLogin({ AccessKeyId: buyer?.AccessKeyId, secretKey: buyer?.secretKey, type: "buyer" });
    }
    if (seller?.userId) {
      _onLogin({ AccessKeyId: seller?.AccessKeyId, secretKey: seller?.secretKey, type: "seller" });
    }
  };

  useEffect(() => {
    unsubscribe(ws);
    if (selectedSymbol?.symbol) {
      subscribe(ws);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    if (userId) {
      refetchOrders();
    }
  }, [userId]);

  const { data: userBalance, mutateAsync: getBalanceInfo } = useMutation(
    ["getAccountBalance"],
    API.getAccountBalance
  );

  const { data: _openOrdersData, mutateAsync: getOpenOrders } = useMutation(
    ["getOpenOrders"],
    API.getOpenOrder,
  );

  const { isLoading: onLoadingLogin, mutate: _onLogin } = useMutation(
    ["getUserInfo"],
    API.getUserInfo,
    {
      onSuccess: async (data, params) => {
        // console.log("getUserInfo", params, data);

        if (data?.data?.status === "error") {
          toast(data?.data?.["err-msg"]);
        } else {
          const balances = await getBalanceInfo({
            userId: data?.data?.data?.[0]?.id,
            AccessKeyId: params?.AccessKeyId,
            secretKey: params?.secretKey,
          });
          if (params?.type === "buyer") {
            setBuyer({
              ...buyer,
              ...params,
              userId: data?.data?.data?.[0]?.id,
              balances: balances?.data?.data?.list,
            });
            sessionStorage.setItem(
              STORE_KEYS.BUYER,
              JSON.stringify({
                ...buyer,
                ...params,
                userId: data?.data?.data?.[0]?.id,
                balances: balances?.data?.data?.list,
              })
            );
          }
          if (params?.type === "seller") {
            setSeller({
              ...seller,
              ...params,
              userId: data?.data?.data?.[0]?.id,
              balances: balances?.data?.data?.list,
            });
            sessionStorage.setItem(
              STORE_KEYS.SELLER,
              JSON.stringify({
                ...seller,
                ...params,
                userId: data?.data?.data?.[0]?.id,
                balances: balances?.data?.data?.list,
              })
            );
          }

          // sessionStorage.setItem(STORE_KEYS.AccessKeyId, params?.AccessKeyId);
          // sessionStorage.setItem(STORE_KEYS.secretKey, params?.secretKey);
          // setUserId(data?.data?.data?.[0]?.id);
        }

      },
      onError: (err: any) => console.log('onError', err)

    }
  );

  const refetchOrders = () => {
    refetchGetOpenOrder();
    refetchGetHistoryOrder();
  };

  const { isLoading: isBuying, mutateAsync: _onBuyOrderAsync, mutate: _onBuyOrder } = useMutation(["buyOrder"], API.buyOrder, {
    onSuccess: (data) => {
      if (data?.data?.status === "error") {
        toast(data?.data?.["err-msg"]);
        throw new Error("Error");
      } else {
        refetchOrders();
      }
    },
    onError: (error) => {
      console.log('error')
      throw new Error("Error");
    }
  });

  const { isLoading: isSelling, mutateAsync: _onSellOrderAsync, mutate: _onSellOrder } = useMutation(["sellOrder"], API.sellOrder, {
    onSuccess: (data) => {
      if (data?.data?.status === "error") {
        toast(data?.data?.["err-msg"]);
      } else {
        refetchOrders();
      }
    },
  });

  const { isLoading: isBatchSelling, mutate: _onSellBatchOrder } = useMutation(["sellOrder"], API.sellBatchOrder, {
    onSuccess: (data) => {
      if (data?.data?.status === "error") {
        toast(data?.data?.["err-msg"]);
      } else {
        refetchOrders();
      }
    },
  });

  const { mutate: _onCancelOrder } = useMutation(["cancelOrder"], API.cancelOrder, {
    onSuccess: (data) => {
      if (data?.data?.status === "error") {
        toast(data?.data?.["err-msg"]);
        throw new Error("Error");
      } else {
        refetchOrders();
      }
    },
    onError: (error) => {
      console.log('error')
      throw new Error("Error");
    }
  });

  const { mutate: _onCancelAllOrder } = useMutation(["cancelAllOrder"], API.cancelAllOrder, {
    onSuccess: (data) => {
      if (data?.data?.status === "error") {
        toast(data?.data?.["err-msg"]);
        throw new Error("Error");
      } else {
        refetchOrders();
      }
    },
    onError: (error) => {
      console.log('error')
      throw new Error("Error");
    }
  });

  const { data: historyOrder, refetch: refetchGetHistoryOrder } = useQuery(
    ["getHistoryOrder", { userId }],
    () =>
      API.getHistoryOrder({
        "account-id": userId,
      }),
    {
      enabled: !!userId,
    }
  );

  const { data: openOrder, refetch: refetchGetOpenOrder } = useQuery(
    ["getOpenOrder", { userId }],
    () => API.getOpenOrder({ "account-id": userId }),
    { enabled: !!userId }
  );

  // const getOpenOrder = async () => {
  //   const buys = onGetOpenOrder({
  //     "account-id": userId,
  //     // symbol: selectedSymbol?.symbol,
  //     // side: "buy",
  //   });
  //   const sells = onGetOpenOrder({
  //     "account-id": userId,
  //     // symbol: selectedSymbol?.symbol,
  //     // side: "buy",
  //   });
  //   const [buysData, sellsData] = await Promise.all([buys, sells]);

  //   setOpenOrders([
  //     ...buysData?.data?.data?.map((it: any) => ({ ...it, side: "buy" })),
  //     ...sellsData?.data?.data?.map((it: any) => ({ ...it, side: "sell" })),
  //   ]);
  // };

  const _ = useQuery(["getAllSymbol"], () => API.getAllSymbol(), {
    onSuccess: (data) =>
      localStorage.setItem(STORE_KEYS?.ALL_SYMBOL, JSON.stringify(data?.data?.data)),
    enabled: !!userId,
  });

  const onLogout = () => {
    setUserId("");
    sessionStorage.clear();
    setUserSelectedInfo({ ...defaultUserInfo });
    setBuyer({ ...defaultUserInfo });
    setSeller({ ...defaultUserInfo });
  };

  const initSocket = () => {
    ws = new WebSocket(variables.WS_URL);
    ws.onopen = function open() { console.log("") };
    ws.onmessage = function (data: any) {
      const fileReader = new FileReader();
      fileReader.onload = function (event: any) {
        const convertedData = event.target.result;
        const text: any = inflate(convertedData, {
          to: "string",
        });
        const msg: any = JSON.parse(text);
        if (msg.ping) {
          ws.send(
            JSON.stringify({
              pong: msg.ping,
            })
          );
        } else if (msg.tick) {
          handle(msg);
        } else {
          console.log(text);
        }
      };

      fileReader.readAsArrayBuffer(data.data);
    };
    ws.onerror = function error(err: any) {
      console.log(err);
    };
    ws.onclose = function error(err: any) {
      console.log(err);
    };
  };

  const handle = (data: any) => {
    // const symbol = data.ch.split(".")[1];
    // const channel = data.ch.split(".")[2];
    // const { asks, bids } = data.tick ?? {}
    setOrdersBook(data.tick);
    // setOrders({
    //     open:asks,
    //     history: bids
    // })
    // switch (channel) {
    //     case "depth":
    //         console.log(data.tick)
    //         // orderbook[symbol] = data.tick;
    //         break;
    // }
  };

  function unsubscribe(ws: any) {
    if (preSymbol)
      ws.send(
        JSON.stringify({
          unsub: `market.${preSymbol?.symbol}.depth.step0`,
        })
      );
  }

  const subscribe = (ws: any) => {
    ws.send(
      JSON.stringify({
        sub: `market.${selectedSymbol?.symbol}.depth.step0`,
        step: "step0",
        symbol: `${selectedSymbol?.symbol}`,
      })
    );
  };

  const allSymbol = localStorage.getItem(STORE_KEYS?.ALL_SYMBOL)
    ? JSON.parse(localStorage.getItem(STORE_KEYS?.ALL_SYMBOL) || "[]")
    : allSymbolData;

  const searchedSymbol =
    searchValue !== "" ? allSymbol?.filter((it: ISymbol) => it?.symbol?.includes(searchValue)) : [];

  const onSelectSymbol = (it: ISymbol) => {
    preSymbol = selectedSymbol;
    setSelectedSymbol(it);
  };

  const onBuy = () => {
    if (!userId) {
      toast("Please select user");
      return;
    }
    if (!selectedSymbol) {
      toast("Please select symbol");
      return;
    }
    _onBuyOrder({
      symbol: selectedSymbol?.symbol ?? "",
      price: buyForm?.price,
      amount: buyForm.amount,
      AccessKeyId: userSelectedInfo?.AccessKeyId,
      secretKey: userSelectedInfo?.secretKey,
      "account-id": userSelectedInfo?.userId,
    });
    refetchOrders();
  };

  // const onSell = () => {
  //   _onSellOrder({
  //     symbol: selectedSymbol?.symbol ?? '',
  //     price: sellForm?.price,
  //     amount: sellForm.amount,
  //     AccessKeyId: userSelectedInfo?.AccessKeyId,
  //     secretKey: userSelectedInfo?.secretKey,
  //     "account-id": userSelectedInfo?.userId,
  //   });
  //   refetchOrders();
  // };

  const onSellBatch = async () => {
    if (!userId) {
      toast("Please select user");
      return;
    }
    if (!selectedSymbol) {
      toast("Please select symbol");
      return;
    }
    const { min, max, amountPerPrice, step } = sellBatchForm;

    const userBalances = await getBalanceInfo({
      userId: userSelectedInfo?.userId,
      AccessKeyId: userSelectedInfo?.AccessKeyId,
      secretKey: userSelectedInfo?.secretKey,
    });
    let userBalance = +userBalances?.data?.data?.list?.find(
      (it: any) =>
        it?.currency === selectedSymbol?.["base-currency"]
    )?.balance || 0;

    const data = [];
    for (let price = +min; price <= +max; price += (+step)) {
      if (+userBalance <= +amountPerPrice) break;
      data.push({
        symbol: selectedSymbol?.symbol ?? '',
        price: floored_val(price, numDecimalDigits),
        amount: +amountPerPrice,
        AccessKeyId: userSelectedInfo?.AccessKeyId,
        secretKey: userSelectedInfo?.secretKey,
        "account-id": userSelectedInfo?.userId,
        type: "sell-limit"
      })
      userBalance = +userBalance - (+amountPerPrice);
    }
    const datas = separatedArray(data, itemsPerBatch);
    await Promise.all(datas.map((item: any) => {
      _onSellBatchOrder(item);
    }))
    refetchOrders();
  };

  const cancelOrder = (id: string) => {
    _onCancelOrder({
      symbol: selectedSymbol?.symbol as string,
      orderId: id,
    });
  };

  const cancelAllOrder = () => {
    _onCancelAllOrder({
      userId: userSelectedInfo?.userId,
      symbol: selectedSymbol?.symbol ?? '',
      side: 'sell',
      types: 'sell-limit',
      AccessKeyId: userSelectedInfo?.AccessKeyId ?? '',
      secretKey: userSelectedInfo?.secretKey ?? '',
    });
  };

  const onSelectUser = (userInfo: any) => {
    sessionStorage.setItem(STORE_KEYS.AccessKeyId, userInfo?.AccessKeyId);
    sessionStorage.setItem(STORE_KEYS.secretKey, userInfo?.secretKey);
    setUserId(userInfo?.userId);
    setUserSelectedInfo(userInfo)
  };

  const getUserBalance = async (userSelectedInfo: any, typeBalance: string) => {
    const userBalances = await getBalanceInfo({
      userId: userSelectedInfo?.userId,
      AccessKeyId: userSelectedInfo?.AccessKeyId,
      secretKey: userSelectedInfo?.secretKey,
    });
    if (typeBalance === "sell") {
      return +userBalances?.data?.data?.list?.find(
        (it: any) =>
          it?.currency === selectedSymbol?.["base-currency"]
      )?.balance || 0;
    }
    return +userBalances?.data?.data?.list?.find(
      (it: any) =>
        it?.currency === selectedSymbol?.["quote-currency"]
    )?.balance || 0;
  }

  const checkOpenOrdersUser = async (userSelectedInfo: any) => {
    const data = await getOpenOrders({
      "account-id": userSelectedInfo?.userId,
      userId: userSelectedInfo?.userId,
      AccessKeyId: userSelectedInfo?.AccessKeyId,
      secretKey: userSelectedInfo?.secretKey,
    })
    return !data?.data?.data?.length;
  }

  const retryCheckOpenOrders = async (userSelectedInfo: any, maxRetries: number, timeout: number) => {
    timeout = timeout * 1000; // convert to milliseconds;
    let retries = 0;

    while (retries < maxRetries) {
      const startTime = Date.now();
      const data = await getOpenOrders({
        "account-id": userSelectedInfo?.userId,
        userId: userSelectedInfo?.userId,
        AccessKeyId: userSelectedInfo?.AccessKeyId,
        secretKey: userSelectedInfo?.secretKey,
      });
      console.log({ data })
      const hasOpenOrder: boolean = data?.data?.data?.length === 0;
      console.log(hasOpenOrder)

      if (hasOpenOrder) {
        console.log('API call successful');
        return true;
      }

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime >= timeout) {
        console.log('Timeout reached');
        return false;
      }
      console.log({ retries })
      retries++;
    }
    console.log('Maximum retries reached');
  }

  const onCreateVolume = async () => {
    if (!selectedSymbol) {
      toast("Please select symbol");
      return;
    }
    setCreateVolLoading(true)
    let { min: minPrice, max: maxPrice, count, desiredVolume: desiredAmount } = createVolumeForm;
    minPrice = +minPrice;
    maxPrice = +maxPrice;
    desiredAmount = +desiredAmount;
    count = +count;

    const user1 = seller;
    const user2 = buyer;

    let currentAmount = 0;
    const pricePrecision = selectedSymbol?.["price-precision"];
    const valuePrecision = selectedSymbol?.["value-precision"];
    const volumePrecision = selectedSymbol?.["amount-precision"];
    const minOrderValue = selectedSymbol?.["min-order-value"] || 10;
    try {
      for (let i = 0; i < count; i++) {
        console.log({ i })
        const maxAmount = Math.min(desiredAmount / count);
        const minAmount = Math.max(desiredAmount / (count + 1));

        const amount1 = generateRandomPrice(minAmount, maxAmount, pricePrecision);
        console.log({ amount1, minAmount, maxAmount })
        if (amount1 < minOrderValue) {
          break;
        }

        const price = generateRandomPrice(minPrice, maxPrice, pricePrecision);
        const volume1 = +(amount1 / price).toFixed(volumePrecision);

        currentAmount += amount1;
        if (currentAmount >= desiredAmount) {
          break;
        }

        // get coin account1 and get money account2
        let [ accountBalanceUser1, accountBalanceUser2 ]  = await Promise.all([
          await getUserBalance(user1, 'sell'),
          await getUserBalance(user2, "buy"),
        ])
        console.log({ accountBalanceUser1, accountBalanceUser2 })
        if (accountBalanceUser1 < volume1 || accountBalanceUser2 < amount1) {
          break;
        }

        Promise.all([
        // account1 sell
          await _onSellOrderAsync({
            "account-id": user1?.userId,
            price,
            amount: volume1,
            symbol: selectedSymbol?.symbol ?? "",
            AccessKeyId: user1?.AccessKeyId,
            secretKey: user1?.secretKey,
          }),
          // account2 buy
          await _onBuyOrderAsync({
            "account-id": user2?.userId,
            price,
            amount: volume1,
            symbol: selectedSymbol?.symbol ?? "",
            AccessKeyId: user2?.AccessKeyId,
            secretKey: user2?.secretKey,
          }),
        ])
        await delay(2000);
        
        const [checkSellUser1, checkBuyUser2] = await Promise.all([
          await retryCheckOpenOrders(user1, 5, 5),
          await retryCheckOpenOrders(user2, 5, 5)
        ])
        if (!checkSellUser1 || !checkBuyUser2) {
          break;
        }

        // ====================
        // ====================

        const amount2 = Math.min(accountBalanceUser2, maxAmount);
        const volume2 = +(amount2 / price).toFixed(volumePrecision);
        console.log({ volume2, accountBalanceUser2, maxAmount });
  
        [ accountBalanceUser1, accountBalanceUser2 ]  = await Promise.all([
          await getUserBalance(user1, 'buy'),
          await getUserBalance(user2, "sell"),
        ])

        // get coin account2
        if (accountBalanceUser2 < volume2 || accountBalanceUser1 < amount2) {
          break;
        }

        Promise.all([
          // account1 sell
          await _onSellOrderAsync({
            "account-id": user2?.userId,
            price,
            amount: volume2,
            symbol: selectedSymbol?.symbol ?? "",
            AccessKeyId: user2?.AccessKeyId,
            secretKey: user2?.secretKey,
          }),
           // account1 buy
          await _onBuyOrderAsync({
            "account-id": user1?.userId,
            price,
            amount: volume2,
            symbol: selectedSymbol?.symbol ?? "",
            AccessKeyId: user1?.AccessKeyId,
            secretKey: user1?.secretKey,
          }),
        ])
        // account2 sell

        // const [checkSellUser2, checkBuyUser1] = await Promise.all([
        //   await retryCheckOpenOrders(user1, 5, 5),
        //   await retryCheckOpenOrders(user2, 5, 5)
        // ])
        // if (!checkSellUser2 || !checkBuyUser1) {
        //   break;
        // }
        toast(`Total volume: ${currentAmount.toFixed(4)}`);
      }
      toast("Create volume successfully");
    } catch (err) {
      const cancelUser1Order = API.cancelAllOrder({ userId: user1?.userId, symbol: selectedSymbol?.symbol ?? '', size: desiredAmount, side: 'sell', types: 'sell-limit', AccessKeyId: user1?.AccessKeyId ?? '', secretKey: user1?.secretKey ?? '' });

      const cancelUser2Order = API.cancelAllOrder({ userId: user2?.userId, symbol: selectedSymbol?.symbol ?? '', size: desiredAmount, side: 'sell', types: 'sell-limit', AccessKeyId: user2?.AccessKeyId ?? '', secretKey: user2?.secretKey ?? '' });
      await Promise.all([cancelUser1Order, cancelUser2Order])
    }
  }

  const reloadProfile = () => {
    if (buyer?.userId) {
      _onLogin({ AccessKeyId: buyer?.AccessKeyId, secretKey: buyer?.secretKey, type: "buyer" });
    }
    if (seller?.userId) {
      _onLogin({ AccessKeyId: seller?.AccessKeyId, secretKey: seller?.secretKey, type: "seller" });
    }
    if (userSelectedInfo?.userId) {
      refetchOrders();
    }
  };

  const swapUser = () => {
    const buyer = JSON.parse(sessionStorage.getItem(STORE_KEYS.BUYER) || "{}");
    const seller = JSON.parse(sessionStorage.getItem(STORE_KEYS.SELLER) || "{}");

    const buyerState = { ...buyer }
    const sellerState = { ...seller }
    setBuyer(sellerState);
    setSeller(buyerState);


    sessionStorage.setItem(
      STORE_KEYS.BUYER,
      JSON.stringify({
        ...seller
      })
    );
    sessionStorage.setItem(
      STORE_KEYS.SELLER,
      JSON.stringify({
        ...buyer
      })
    );

  }

  return (
    <HomeView
      {...{
        symbols: searchedSymbol,
        searchValue,
        setSearchValue,
        onSelectSymbol,
        ordersBook,
        openOrders: openOrder?.data?.data,
        // openOrders: [
        //   {
        //     symbol: "apnusdt",
        //     source: "web",
        //     price: "1.555550000000000000",
        //     "created-at": 1630633835224,
        //     amount: "572.330000000000000000",
        //     "account-id": 13496526,
        //     "filled-cash-amount": "0.0",
        //     "client-order-id": "",
        //     "filled-amount": "0.0",
        //     "filled-fees": "0.0",`
        //     id: 357630527817871,
        //     state: "submitted",
        //     type: "sell-limit",
        //   },
        // ],
        historyOrder: historyOrder?.data?.data,
        userId,
        // userInfo,
        // setUserInfo,
        onLogin: _onLogin,
        onLoadingLogin,
        onLogout,
        // userBalance: userBalance?.data?.data?.list?.filter((it: any) => +it?.balance > 0),
        buyForm,
        setBuyForm,
        createVolumeForm,
        setCreateVolumeForm,
        onBuy,
        isBuying,
        sellBatchForm,
        setSellBatchForm,
        onSellBatch,
        isBatchSelling,
        cancelOrder,
        cancelAllOrder,
        buyer,
        setBuyer,
        seller,
        setSeller,
        selectedSymbol,
        onSelectUser,
        onCreateVolume,
        reloadProfile,
        swapUser
      }}
    />
  );
};

export default memo(Home);
