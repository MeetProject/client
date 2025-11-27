import { DeviceProvider, WebSocketProvider } from "@/provider";

export default function RootProvider({children}) {
  return(
    <WebSocketProvider>
      <DeviceProvider>
        {children}
      </DeviceProvider>
    </WebSocketProvider>
  )
}