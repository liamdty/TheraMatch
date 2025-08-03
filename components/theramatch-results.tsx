"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, MapPin, Phone, CheckCircle, ChevronDown, ChevronUp, Award, Trophy, Eye, Play, Pause } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface TherapistProfile {
  uuid: string;
  id: number;
  listingName: string;
  verificationStatus: string;
  canonicalUrl: string;
  suffixes: { label: string; isWriteIn?: boolean; type?: string }[];
  healthRole: string;
  healthRoleWriteIn?: string;
  introVideo?: {
    thumbnail: string;
    source: string;
    width: number;
    height: number;
    type: string;
  } | null;
  photoUrls: {
    thumbnail: string;
  };
  primaryLocation: {
    postalCode: string;
    regionName: string;
    regionCode: string;
    cityName: string;
    countryCode: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2?: string;
  };
  appointmentTypes: {
    inPerson: boolean;
    online: boolean;
  };
  personalStatement: string;
  aiRank: number;
  aiDescription: string;
}

interface TherapistData {
  profiles: TherapistProfile[];
  aiAnalysis?: {
    rankedMatches: Array<{
      originalId: number;
      rank: number;
      description: string;
    }>;
  };
}

export default function TheraMatchResults() {
  const [showAllCandidates, setShowAllCandidates] = useState(false)
  const [primaryTherapistIndex, setPrimaryTherapistIndex] = useState(0)
  const [therapistData, setTherapistData] = useState<TherapistData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewedProfiles, setViewedProfiles] = useState<Set<string>>(new Set())
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [showVideoControls, setShowVideoControls] = useState(true)
  const router = useRouter()
  const primaryTherapistRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLIFrameElement>(null)
  const controlTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    try {
      const storedData = localStorage.getItem('therapistMatchResults')
      if (storedData) {
        const parsedData = JSON.parse(storedData)
        setTherapistData(parsedData)
        
        // Mark the first profile as viewed since it's shown by default
        if (parsedData.profiles && parsedData.profiles.length > 0) {
          setViewedProfiles(new Set([parsedData.profiles[0].uuid]))
        }
      } else {
        setError('No therapist match data found. Please go back and try again.')
      }
    } catch (err) {
      setError('Failed to load therapist match data.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Listen for Vimeo player events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://player.vimeo.com') return
      
      try {
        const data = JSON.parse(event.data)
        if (data.event === 'play') {
          setIsVideoPlaying(true)
          setShowVideoControls(true)
          hideControlsAfterDelay()
        } else if (data.event === 'pause') {
          setIsVideoPlaying(false)
          setShowVideoControls(true)
          if (controlTimeoutRef.current) {
            clearTimeout(controlTimeoutRef.current)
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlTimeoutRef.current) {
        clearTimeout(controlTimeoutRef.current)
      }
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your therapist matches...</p>
        </div>
      </div>
    )
  }

  if (error || !therapistData || !therapistData.profiles.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-4">{error || 'No therapist matches found.'}</p>
          <Button onClick={() => router.push('/')}>Back to Search</Button>
        </div>
      </div>
    )
  }

  const primaryTherapist = therapistData.profiles[primaryTherapistIndex]
  const otherTherapists = therapistData.profiles.filter((_, index) => index !== primaryTherapistIndex)

  const formatCredentials = (suffixes: any[]) => {
    return suffixes
      .filter((s) => s.label && !s.label.includes("HealthRoles"))
      .map((s) => s.label)
      .join(", ")
  }

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "")
    const match = cleaned.match(/^1?(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    return phone
  }

  const hideControlsAfterDelay = () => {
    if (controlTimeoutRef.current) {
      clearTimeout(controlTimeoutRef.current)
    }
    controlTimeoutRef.current = setTimeout(() => {
      setShowVideoControls(false)
    }, 3000) // Hide after 3 seconds
  }

  const toggleVideoPlayback = (videoSource: string) => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        // Pause video using postMessage API
        videoRef.current.contentWindow?.postMessage('{"method":"pause"}', '*')
        setIsVideoPlaying(false)
        setShowVideoControls(true)
        if (controlTimeoutRef.current) {
          clearTimeout(controlTimeoutRef.current)
        }
      } else {
        // Play video using postMessage API
        videoRef.current.contentWindow?.postMessage('{"method":"play"}', '*')
        setIsVideoPlaying(true)
        setShowVideoControls(true)
        hideControlsAfterDelay()
      }
    }
  }

  const handleVideoContainerClick = (videoSource: string) => {
    toggleVideoPlayback(videoSource)
  }

  const handleViewProfile = (therapistUuid: string) => {
    const newIndex = therapistData?.profiles.findIndex((t) => t.uuid === therapistUuid)
    if (newIndex !== -1 && newIndex !== undefined) {
      setPrimaryTherapistIndex(newIndex)
      
      // Reset video playing state and controls when switching profiles
      setIsVideoPlaying(false)
      setShowVideoControls(true)
      if (controlTimeoutRef.current) {
        clearTimeout(controlTimeoutRef.current)
      }
      
      // Mark this profile as viewed
      setViewedProfiles(prev => new Set(prev).add(therapistUuid))
      
      // Scroll to the top of the primary therapist section
      if (primaryTherapistRef.current) {
        primaryTherapistRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      } else {
        // Fallback to scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  const getBadgeContent = () => {
    if (primaryTherapist.aiRank === 1) {
      return {
        icon: <Trophy className="w-4 h-4 mr-1 fill-current" />,
        text: "Top Match",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      }
    } else {
      return {
        icon: <Award className="w-4 h-4 mr-1 fill-current" />,
        text: "Recommended",
        className: "bg-primary/10 text-primary border-primary/20",
      }
    }
  }

  const badgeContent = getBadgeContent()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex justify-between items-center p-6 relative z-10">
        <div className="flex items-center gap-1">
          <Image src="https://files.catbox.moe/xbfenx.svg" width={128} height={128}  className="w-14 h-14" alt="TheraMatch Logo" />
          <div className="font-bold text-lg text-dark">TheraMatch</div>
        </div>
        <button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 py-2 text-sm cursor-pointer font-semibold transition-colors"
          onClick={() => router.push('/')}>
          Back to Search
        </button>
      </header>
              {/* Top Recommended Therapist */}
        <section ref={primaryTherapistRef} className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <Badge className={`${badgeContent.className} mb-4`}>
                {badgeContent.icon}
                {badgeContent.text}
              </Badge>
              <h2 className="text-2xl font-bold text-foreground">
                Our #{primaryTherapist.aiRank} Recommendation for You
              </h2>
            </div>

            <Card className="bg-card shadow-lg">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-8">
                  {/* Photo/Video Section */}
                  <div className="flex flex-col h-full">
                    <div className="flex-1 mb-4 min-h-80">
                      {primaryTherapist.introVideo && primaryTherapist.introVideo.source ? (
                        // Vimeo container with custom controls
                        <div 
                          className="relative w-full max-h-80 overflow-hidden rounded-lg cursor-pointer group"
                          onClick={() => handleVideoContainerClick(primaryTherapist.introVideo!.source)}
                          onMouseEnter={() => {
                            setShowVideoControls(true)
                            if (controlTimeoutRef.current) {
                              clearTimeout(controlTimeoutRef.current)
                            }
                          }}
                          onMouseLeave={() => {
                            if (isVideoPlaying) {
                              hideControlsAfterDelay()
                            }
                          }}
                        >
                          <iframe
                            ref={videoRef}
                            src={`${primaryTherapist.introVideo.source}?api=1&controls=0&title=0&byline=0&portrait=0`}
                            className="w-full h-80 rounded-lg pointer-events-none"
                            frameBorder="0"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                            onLoad={() => {
                              // Register for play/pause events once iframe loads
                              if (videoRef.current?.contentWindow) {
                                videoRef.current.contentWindow.postMessage('{"method":"addEventListener","value":"play"}', '*')
                                videoRef.current.contentWindow.postMessage('{"method":"addEventListener","value":"pause"}', '*')
                              }
                            }}
                          />
                          
                          {/* Custom Play/Pause Button - Bottom Right */}
                          <div 
                            className={`absolute bottom-4 right-4 transition-all duration-300 ${
                              showVideoControls || !isVideoPlaying 
                                ? 'opacity-100 translate-y-0' 
                                : 'opacity-0 translate-y-2'
                            }`}
                          >
                            <Button
                              size="sm"
                              className="bg-black/60 hover:bg-black/80 text-white rounded-full w-12 h-12 p-0 shadow-lg backdrop-blur-sm border border-white/20"
                            >
                              {isVideoPlaying ? (
                                <Pause className="w-4 h-4" fill="currentColor" />
                              ) : (
                                <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Square image if no video
                        <Image
                          width={1024}
                          height={1024}
                          src={primaryTherapist.photoUrls.thumbnail || "/placeholder.svg"}
                          alt={primaryTherapist.listingName}
                          className="w-full aspect-square object-cover rounded-lg"
                          priority
                        />
                      )}
                    </div>

                    {/* Contact info at bottom */}
                    <div className="space-y-3 mt-auto">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {primaryTherapist.primaryLocation.addressLine1}{primaryTherapist.primaryLocation.addressLine1 ? `, ` : ""}{primaryTherapist.primaryLocation.cityName}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {formatPhoneNumber(primaryTherapist.primaryLocation.phoneNumber)}
                      </div>
                      <div className="flex gap-2">
                        {primaryTherapist.appointmentTypes.inPerson && (
                          <Badge variant="outline" className="text-xs">
                            In-Person
                          </Badge>
                        )}
                        {primaryTherapist.appointmentTypes.online && (
                          <Badge variant="outline" className="text-xs">
                            Online
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <div className="flex items-start gap-3 mb-2">
                        {primaryTherapist.introVideo && (
                          <Image
                            width={1024}
                            height={1024}
                            src={primaryTherapist.photoUrls.thumbnail || "/placeholder.svg"}
                            alt={primaryTherapist.listingName}
                            className="w-16 h-16 object-cover rounded-full flex-shrink-0 mt-1"
                            priority
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-foreground mb-1">{primaryTherapist.listingName}</h3>
                          <p className="text-primary font-medium mb-1">
                            {primaryTherapist.healthRole
                              .replace(/_/g, " ")
                              .toLowerCase()
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-muted-foreground text-sm">
                              {formatCredentials(primaryTherapist.suffixes)}
                            </p>
                            {primaryTherapist.verificationStatus === "VERIFIED" && (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Why Recommended */}
                    <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
                      <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4 fill-current" />
                        Why We Recommend This Match
                      </h4>
                      <p className="text-dark text-sm leading-relaxed">{primaryTherapist.aiDescription}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <div className="flex-1">
                        <Button className="w-full" onClick={() => window.open(primaryTherapist.canonicalUrl, "_blank")}>
                          Book Consultation
                        </Button>
                        <p className="text-xs text-muted-foreground text-center mt-1">or send an email!</p>
                      </div>
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => window.open(`tel:${primaryTherapist.primaryLocation.phoneNumber}`, "_self")}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call Now
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Other Candidates */}
      <section className="py-8 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <Button variant="outline" onClick={() => setShowAllCandidates(!showAllCandidates)}>
                {showAllCandidates ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Hide Other Matches
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    View Other Qualified Matches ({otherTherapists.length})
                  </>
                )}
              </Button>
            </div>

            {showAllCandidates && (
              <div className="space-y-6">
                {otherTherapists.map((therapist) => {
                  const originalIndex = therapistData?.profiles.findIndex((t) => t.uuid === therapist.uuid)
                  return (
                    <Card key={therapist.uuid} className="bg-muted/30">
                      <CardContent className="p-6">
                        <div className="flex gap-6">
                          <Image
                            width={1024}
                            height={1024}
                            src={therapist.photoUrls.thumbnail || "/placeholder.svg"}
                            alt={therapist.listingName}
                            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                          />

                          <div className="flex-1 space-y-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-lg font-semibold text-foreground">{therapist.listingName}</h4>
                                <Badge variant="outline" className="text-xs">
                                  #{therapist.aiRank} Match
                                </Badge>
                                {viewedProfiles.has(therapist.uuid) && (
                                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                    <Eye className="w-3 h-3 mr-1" />
                                    Viewed
                                  </Badge>
                                )}
                              </div>
                              <p className="text-primary text-sm font-medium">
                                {therapist.healthRole
                                  .replace(/_/g, " ")
                                  .toLowerCase()
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </p>
                              <p className="text-muted-foreground text-sm">{formatCredentials(therapist.suffixes)}</p>
                            </div>

                            <p className="text-foreground text-sm leading-relaxed">{therapist.aiDescription}</p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {therapist.primaryLocation.cityName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {formatPhoneNumber(therapist.primaryLocation.phoneNumber)}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleViewProfile(therapist.uuid)}>
                                  View Profile
                                </Button>
                                <Button size="sm" onClick={() => window.open(therapist.canonicalUrl, "_blank")}>
                                  Book
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
