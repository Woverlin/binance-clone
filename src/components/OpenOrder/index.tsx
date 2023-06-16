import { IOpenOrder } from "../../interface";
import Empty from "../svg/Empty";
import moment from 'moment'

const OpenOrders = ({ data = [] }: { label?: string, data?: IOpenOrder[] }) => {

    const sortedData = data?.sort((a: IOpenOrder, b: IOpenOrder) => a["created-at"] - b["created-at"])

    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg flex-1 max-h-[600px] overflow-auto">
            <div className="sticky top-0 p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
                Open Orders
            </div>
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className=" sticky top-[68px] text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-6 py-3">
                            Price
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Amount
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Time
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData?.map((it: IOpenOrder, key: number) => {
                        const { side, price, amount } = it ?? {}
                        return (

                            <tr key={key} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                <td
                                    className={`px-6 py-4 ${side === 'buy' ? 'text-green-500' : 'text-red-500'} font-medium text-gray-900 whitespace-nowrap dark:text-white`}>
                                    {price}
                                </td>
                                <td className={`px-6 py-4 ${side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>{amount}</td>
                                <td className={`px-6 py-4 ${side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>{it?.['created-at'] ? moment.unix(it?.['created-at']).format('hh:mm;ss') : ''}</td>
                            </tr>
                        )
                    })
                    }
                </tbody>
            </table>
            {!data?.length && <div className='w-full h-[300px] justify-center items-center flex flex-col'>
                <Empty className='w-[40px] h-[40px]' />
                No Data
            </div>}

        </div>
    );
};

export default OpenOrders;
