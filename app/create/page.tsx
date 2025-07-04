"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    LinkIcon,
    Type,
    ImageIcon,
    Lock,
    Eye,
    EyeOff,
    Plus,
    Bell,
    MessageCircle,
    User,
    ChevronDown,
    ArrowLeft,
    Search,
    X,
    Menu,
    Home,
    Compass,
} from "lucide-react"
import axios from "axios"
import Card from "@/components/card"
import InboxPopup from "@/components/popups/inbox-popup"
import SettingsPopup from "@/components/popups/settings-popup"
import NotificationsPopup from "@/components/popups/notifications-popup"

export default function CreatePage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [selectedCard, setSelectedCard] = useState<any>(null)

    // Form state
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [webLink, setWebLink] = useState("")
    const [modalText, setModalText] = useState("")
    const [imageUrl, setImageUrl] = useState("")
    const [linkData, setLinkData] = useState<any>({})
    const [isLockSelected, setIsLockSelected] = useState(false)
    const [isPrivacySelected, setIsPrivacySelected] = useState(false)

    // Modal and popup states
    const [isTextModalOpen, setIsTextModalOpen] = useState(false)
    const [isInboxPopupOpen, setIsInboxPopupOpen] = useState(false)
    const [isSettingsPopupOpen, setIsSettingsPopupOpen] = useState(false)
    const [isNotificationsPopupOpen, setIsNotificationsPopupOpen] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Loading states
    const [isCreating, setIsCreating] = useState(false)
    const [isUploadingImage, setIsUploadingImage] = useState(false)

    useEffect(() => {
        window.scrollTo(0, 0)

        // Get user from localStorage
        const userData = localStorage.getItem("user")
        if (userData) {
            setUser(JSON.parse(userData))
        }

        // Get selected card if coming from event page
        const selectedCardData = localStorage.getItem("selectedCard")
        if (selectedCardData) {
            const card = JSON.parse(selectedCardData)
            setSelectedCard(card)
            setIsLockSelected(card.lock || false)
            setIsPrivacySelected(card.privacy || false)
        }
    }, [])

    const fetchMetadata = async () => {
        try {
            const response = await axios.get(`https://dxh5nvxzgreic.cloudfront.net/metadata`, {
                params: { url: webLink },
            })
            const metadata = response.data
            setLinkData(metadata)
        } catch (error) {
            console.error("Error fetching metadata:", error)
            alert("Error fetching metadata: " + error)
        }
    }

    useEffect(() => {
        if (webLink) {
            fetchMetadata()
        }
    }, [webLink])

    const handleImageUpload = async (file: File) => {
        if (!file) return

        setIsUploadingImage(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            const response = await axios.post(`https://d3kv9nj5wp3sq6.cloudfront.net/uploads/feed-item`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
            setImageUrl(response.data.imageUrl)
        } catch (error) {
            console.error("Error uploading file:", error)
        } finally {
            setIsUploadingImage(false)
        }
    }

    const createHomefeedData = async (parentId: number) => {
        const token = localStorage.getItem("token")

        return axios.post(
            `https://d3kv9nj5wp3sq6.cloudfront.net/homefeed/${user.username}`,
            {
                title: title || linkData.title,
                description: description || linkData.description,
                image: imageUrl || linkData.image,
                text: modalText,
                parent: parentId,
                username: user.username,
                picture: user.image,
                weblink: webLink,
                lock: selectedCard?.lock || isLockSelected,
                privacy: selectedCard?.privacy || isPrivacySelected,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            },
        )
    }

    const createProfilefeedData = async (parentId: number) => {
        const token = localStorage.getItem("token")

        return axios.post(
            `https://d3kv9nj5wp3sq6.cloudfront.net/profilefeed/${user.username}/created`,
            {
                title: title || linkData.title,
                description: description || linkData.description,
                image: imageUrl || linkData.image,
                text: modalText,
                parent: parentId,
                username: user.username,
                picture: user.image,
                weblink: webLink,
                lock: selectedCard?.lock || isLockSelected,
                privacy: selectedCard?.privacy || isPrivacySelected,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            },
        )
    }

    const handleCreate = async () => {
        setIsCreating(true)
        try {
            // Use existing parent if adding to collection, otherwise generate unique one
            const parentId = selectedCard?.parent || (await generateUniqueParent())

            await Promise.all([createHomefeedData(parentId), createProfilefeedData(parentId)])

            localStorage.removeItem("selectedCard")
            router.back()
        } catch (error) {
            console.error("Error creating card:", error)
        } finally {
            setIsCreating(false)
        }
    }

    const generateUniqueParent = async (): Promise<number> => {
        const token = localStorage.getItem("token")

        try {
            // Fetch all cards to get existing parent IDs
            const response = await fetch(`https://d3kv9nj5wp3sq6.cloudfront.net/homefeed`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const allCards = await response.json()

            // Extract all existing parent IDs
            const existingParents = new Set(allCards.map((card: any) => card.parent))

            // Generate a unique parent ID
            let parentId: number
            do {
                parentId = Math.floor(Math.random() * 1000000)
            } while (existingParents.has(parentId))

            return parentId
        } catch (error) {
            console.error("Error fetching cards for parent uniqueness check:", error)
            // Fallback: generate random number if fetch fails
            return Math.floor(Math.random() * 1000000)
        }
    }

    const isEmptyObject = (obj: any) => {
        return Object.keys(obj).length === 0
    }

    const handleUserTagClick = (username: string) => {
        if (username === user?.username) {
            router.push("/profile")
        } else {
            localStorage.setItem("profileUsername", username)
            router.push("/profile/user")
        }
    }

    const handleCardTagClick = (cardId: number) => {
        const cardElement = document.getElementById(`card-${cardId}`)
    }

    const hasContent = title || description || modalText || imageUrl || !isEmptyObject(linkData)

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* Desktop Navbar - Hidden on Mobile */}
            <nav className="hidden md:block fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center space-x-4">
                            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <Link href="/home" className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">O</span>
                                </div>
                                <span className="font-bold text-xl text-gray-900">Opinio^nth</span>
                            </Link>
                        </div>

                        {/* Navigation Links */}
                        <div className="flex items-center space-x-1">
                            {[
                                { name: "Home", href: "/home", key: "home" },
                                { name: "Explore", href: "/explore", key: "explore" },
                                { name: "Create", href: "/create", key: "create" },
                            ].map((item) => (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-md mx-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search posts..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-full text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Action Icons */}
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setIsNotificationsPopupOpen(true)}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200 relative"
                            >
                                <Bell className="w-5 h-5" />
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                            </button>

                            <button
                                onClick={() => setIsInboxPopupOpen(true)}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200 relative"
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></span>
                            </button>

                            <Link
                                href="/profile"
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200"
                            >
                                <User className="w-5 h-5" />
                            </Link>

                            <button
                                onClick={() => setIsSettingsPopupOpen(true)}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200"
                            >
                                <ChevronDown className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Header - Hidden on Desktop */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <div className="flex items-center justify-between px-4 h-14">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>

                    <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-md flex items-center justify-center">
                            <span className="text-white font-bold text-xs">O</span>
                        </div>
                        <span className="font-bold text-lg text-gray-900">Create</span>
                    </div>

                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <Menu className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-50">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    ></div>
                    <div className="absolute top-0 right-0 w-64 h-full bg-white shadow-xl">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-900">Menu</span>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4 space-y-4">
                            <Link href="/home" className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg">
                                <Home className="w-5 h-5 text-gray-600" />
                                <span className="text-gray-900">Home</span>
                            </Link>
                            <Link href="/explore" className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg">
                                <Compass className="w-5 h-5 text-gray-600" />
                                <span className="text-gray-900">Explore</span>
                            </Link>
                            <Link href="/profile" className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg">
                                <User className="w-5 h-5 text-gray-600" />
                                <span className="text-gray-900">Profile</span>
                            </Link>
                            <button
                                onClick={() => {
                                    setIsNotificationsPopupOpen(true)
                                    setIsMobileMenuOpen(false)
                                }}
                                className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg w-full text-left"
                            >
                                <Bell className="w-5 h-5 text-gray-600" />
                                <span className="text-gray-900">Notifications</span>
                            </button>
                            <button
                                onClick={() => {
                                    setIsInboxPopupOpen(true)
                                    setIsMobileMenuOpen(false)
                                }}
                                className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg w-full text-left"
                            >
                                <MessageCircle className="w-5 h-5 text-gray-600" />
                                <span className="text-gray-900">Messages</span>
                            </button>
                            <Link
                                href="/"
                                className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg"
                                onClick={() => {
                                    localStorage.removeItem("token");
                                    localStorage.removeItem("user");
                                    setIsMobileMenuOpen(false)
                                }}
                            >
                                <User className="w-5 h-5 text-gray-600" />
                                <span className="text-gray-900">Logout</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Main Content - Hidden on Mobile */}
            <div className="hidden md:block bg-gray-800 text-white min-h-screen font-sans mt-16">
                {/* Title Section */}
                <div className="flex flex-col items-center mb-5 pt-5">
                    <input
                        type="text"
                        placeholder="Add your event a title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-3/5 p-2.5 my-2.5 border-none rounded-md bg-transparent text-white text-4xl text-center font-bold pt-7 placeholder-white focus:outline-none focus:border-b-2 focus:border-white focus:bg-gray-600"
                    />
                    <input
                        type="text"
                        placeholder="And add an awesome description!"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-3/5 p-2.5 my-2.5 border-none rounded-md bg-transparent text-white text-base text-center placeholder-white focus:outline-none focus:border-b-2 focus:border-white focus:bg-gray-600"
                    />
                </div>

                {/* Input Section */}
                <div className="flex justify-center mb-5">
                    <div className="flex items-center bg-gray-500 rounded-2xl p-5 w-3/5">
                        <LinkIcon className="mx-2.5 cursor-pointer h-6 w-6" />
                        <input
                            type="text"
                            placeholder="Paste any web address"
                            value={webLink}
                            onChange={(e) => setWebLink(e.target.value)}
                            className="flex-1 p-2.5 border-none rounded-md bg-gray-500 text-white text-base placeholder-black focus:outline-none"
                        />
                        <button onClick={() => setIsTextModalOpen(true)} className="mx-2.5 cursor-pointer h-6 w-6">
                            <Type />
                        </button>
                        <label className="mx-2.5 cursor-pointer h-6 w-6">
                            <ImageIcon />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                                className="hidden"
                            />
                        </label>
                        <button
                            onClick={() => setIsLockSelected(!isLockSelected)}
                            className={`mx-2.5 cursor-pointer h-6 w-6 transition-opacity duration-300 ${isLockSelected ? "opacity-100" : "opacity-50"
                                }`}
                        >
                            <Lock />
                        </button>
                        <button
                            onClick={() => setIsPrivacySelected(!isPrivacySelected)}
                            className={`mx-2.5 cursor-pointer h-6 w-6 transition-opacity duration-300 ${isPrivacySelected ? "opacity-100" : "opacity-50"
                                }`}
                        >
                            {isPrivacySelected ? <EyeOff /> : <Eye />}
                        </button>
                    </div>
                </div>

                {/* Content Section */}
                {hasContent && (
                    <div className="flex flex-col items-center w-full">
                        <div className="bg-gray-800 rounded-md pt-5 pb-24 w-full flex justify-center items-center">
                            <div className="max-w-sm">
                                <Card
                                    user={user.username}
                                    title={title || linkData.title || ""}
                                    description={description || linkData.description || ""}
                                    text={modalText}
                                    image={imageUrl || linkData.image}
                                    picture={user.image}
                                    onClick={() => { }}
                                    onCardTagClick={handleCardTagClick}
                                    onUserTagClick={handleUserTagClick}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Main Content - Hidden on Desktop */}
            <div className="md:hidden bg-gray-800 text-white min-h-screen font-sans pt-14">
                <div className="px-4 py-6 space-y-6">
                    {/* Mobile Title Section */}
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Add your event a title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-4 border-none rounded-lg bg-gray-700 text-white text-xl font-bold placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <textarea
                            placeholder="And add an awesome description!"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full p-4 border-none rounded-lg bg-gray-700 text-white text-base placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                    </div>

                    {/* Mobile Link Input */}
                    <div className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-4">
                            <LinkIcon className="h-5 w-5 text-gray-300" />
                            <input
                                type="text"
                                placeholder="Paste any web address"
                                value={webLink}
                                onChange={(e) => setWebLink(e.target.value)}
                                className="flex-1 p-3 border-none rounded-lg bg-gray-600 text-white text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        {/* Mobile Action Buttons */}
                        <div className="grid grid-cols-4 gap-3">
                            <button
                                onClick={() => setIsTextModalOpen(true)}
                                className="flex flex-col items-center justify-center p-3 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors"
                            >
                                <Type className="h-5 w-5 text-white mb-1" />
                                <span className="text-xs text-gray-300">Text</span>
                            </button>

                            <label className="flex flex-col items-center justify-center p-3 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors cursor-pointer">
                                <ImageIcon className="h-5 w-5 text-white mb-1" />
                                <span className="text-xs text-gray-300">Image</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                                    className="hidden"
                                />
                            </label>

                            <button
                                onClick={() => setIsLockSelected(!isLockSelected)}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${isLockSelected ? "bg-purple-600 text-white" : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                                    }`}
                            >
                                <Lock className="h-5 w-5 mb-1" />
                                <span className="text-xs">Lock</span>
                            </button>

                            <button
                                onClick={() => setIsPrivacySelected(!isPrivacySelected)}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${isPrivacySelected ? "bg-purple-600 text-white" : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                                    }`}
                            >
                                {isPrivacySelected ? <EyeOff className="h-5 w-5 mb-1" /> : <Eye className="h-5 w-5 mb-1" />}
                                <span className="text-xs">Privacy</span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Content Preview */}
                    {hasContent && (
                        <div className="bg-gray-700 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-gray-300 mb-3">Preview</h3>
                            <div className="max-w-full">
                                <Card
                                    user={user.username}
                                    title={title || linkData.title || ""}
                                    description={description || linkData.description || ""}
                                    text={modalText}
                                    image={imageUrl || linkData.image}
                                    picture={user.image}
                                    onClick={() => { }}
                                    onCardTagClick={handleCardTagClick}
                                    onUserTagClick={handleUserTagClick}
                                />
                            </div>
                        </div>
                    )}

                    {/* Mobile Upload Status */}
                    {isUploadingImage && (
                        <div className="bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center space-x-3">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
                                <span className="text-sm text-gray-300">Uploading image...</span>
                            </div>
                        </div>
                    )}

                    {/* Bottom spacing for floating button */}
                    <div className="h-20"></div>
                </div>
            </div>

            {/* Text Modal - Responsive */}
            {isTextModalOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsTextModalOpen(false)}
                    ></div>
                    <div className="absolute inset-4 md:inset-8 lg:inset-16 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                            <h3 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center space-x-2">
                                <Type className="w-5 h-5 text-purple-600" />
                                <span>Add Text Content</span>
                            </h3>
                            <button
                                onClick={() => setIsTextModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 p-4 md:p-6 text-black">
                            <textarea
                                value={modalText}
                                onChange={(e) => setModalText(e.target.value)}
                                placeholder="Share your thoughts, ideas, or story..."
                                className="w-full h-full resize-none border-0 focus:outline-none text-base md:text-lg leading-relaxed  text-black placeholder-gray-400"
                            />
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-500">{modalText.length} characters</div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setIsTextModalOpen(false)}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => setIsTextModalOpen(false)}
                                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Create Button - Responsive - Hide when text modal is open */}
            {!isTextModalOpen && (
                <button
                    onClick={handleCreate}
                    disabled={isCreating}
                    className="fixed bottom-6 right-6 md:bottom-8 md:left-1/2 md:transform md:-translate-x-1/2 md:right-auto w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex justify-center items-center cursor-pointer z-50 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                >
                    {isCreating ? (
                        <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-white"></div>
                    ) : (
                        <Plus className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    )}
                </button>
            )}

            {/* Popups */}
            <InboxPopup isOpen={isInboxPopupOpen} onClose={() => setIsInboxPopupOpen(false)} />
            <SettingsPopup isOpen={isSettingsPopupOpen} onClose={() => setIsSettingsPopupOpen(false)} />
            <NotificationsPopup isOpen={isNotificationsPopupOpen} onClose={() => setIsNotificationsPopupOpen(false)} />
        </>
    )
}
