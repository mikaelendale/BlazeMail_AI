import Echo from "laravel-echo"
import Pusher from "pusher-js"

// 🔥 CONFIGURE PUSHER FOR REAL-TIME UPDATES
window.Pusher = Pusher

window.Echo = new Echo({
    broadcaster: "pusher",
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true,

    // Authentication for private channels
    auth: {
        headers: {
            "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content"),
        },
    },
})

// 🔥 CONNECTION EVENT LISTENERS
window.Echo.connector.pusher.connection.bind("connected", () => {
    // console.log("Connected to Pusher!")
    window.dispatchEvent(new CustomEvent("pusher-connected"))
})

window.Echo.connector.pusher.connection.bind("disconnected", () => {
    // console.log("Disconnected from Pusher")
    window.dispatchEvent(new CustomEvent("pusher-disconnected"))
})

window.Echo.connector.pusher.connection.bind("error", (error) => {
    // console.error("Pusher connection error:", error)
    window.dispatchEvent(new CustomEvent("pusher-error", { detail: error }))
})

export default window.Echo
