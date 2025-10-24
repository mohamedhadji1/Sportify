import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../shared/ui/components/Button"
import { TextInput } from "../../shared/ui/components/TextInput"
import { Card } from "../../shared/ui/components/Card"
import { Container } from "../../shared/ui/components/Container"
import { FileUpload } from "../../shared/ui/components/FileUpload"
import {
  CheckCircle,
  Upload,
  X,
  DollarSign,
  FileText,
  Camera,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Star,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react"

const CATEGORIES = [
  { value: "Tennis", label: "Tennis", icon: "🎾", color: "from-green-500 to-emerald-600" },
  { value: "Football", label: "Football", icon: "⚽", color: "from-blue-500 to-cyan-600" },
  { value: "Basketball", label: "Basketball", icon: "🏀", color: "from-orange-500 to-red-600" },
  { value: "Fitness", label: "Fitness", icon: "💪", color: "from-purple-500 to-pink-600" },
  { value: "Other", label: "Other", icon: "🏃", color: "from-gray-500 to-slate-600" },
]

const FORM_STEPS = [
  {
    id: 1,
    title: "Equipment Details",
    description: "Tell us about your item",
    icon: FileText,
    estimatedTime: "2 min",
  },
  {
    id: 2,
    title: "Pricing & Category",
    description: "Set your price and category",
    icon: DollarSign,
    estimatedTime: "1 min",
  },
  {
    id: 3,
    title: "Photos & Review",
    description: "Add photos and finalize",
    icon: Camera,
    estimatedTime: "3 min",
  },
]

export default function SubmitProduct() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    currency: "USD",
    category: "Other",
    images: [],
  })
  const [status, setStatus] = useState(null)
  const [errors, setErrors] = useState({})
  const [currentStep, setCurrentStep] = useState(1)

  const previews = useMemo(() => {
    try {
      if (!form.images || form.images.length === 0) return []
      const arr = Array.from(form.images)
      return arr.map((f, index) => ({
        id: index,
        name: f.name,
        url: URL.createObjectURL(f),
        size: (f.size / 1024 / 1024).toFixed(2) + " MB",
        type: f.type,
      }))
    } catch (e) {
      console.error("Error generating previews:", e)
      return []
    }
  }, [form.images])

  const setField = (key, value) => setForm((s) => ({ ...s, [key]: value }))

  const handleChange = (e) => {
    const { name, value } = e.target
    setField(name, value)
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleFiles = (eOrFiles) => {
    let files = eOrFiles
    if (eOrFiles && eOrFiles.target && eOrFiles.target.files) files = eOrFiles.target.files

    const arr = Array.from(files || []).slice(0, 4)
    const validFiles = arr.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, images: `File ${file.name} is too large (max 5MB)` }))
        return false
      }
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, images: `File ${file.name} is not a valid image` }))
        return false
      }
      return true
    })

    setField("images", validFiles)
    if (validFiles.length > 0 && errors.images) {
      setErrors((prev) => ({ ...prev, images: null }))
    }
  }

  const removeImage = (index) => {
    const arr = Array.from(form.images || [])
    arr.splice(index, 1)
    setField("images", arr)
  }

  const validate = (step = null) => {
    const errs = {}

    if (!step || step === 1) {
      if (!form.title || form.title.trim().length < 3) {
        errs.title = "Title must be at least 3 characters"
      }
      if (form.title && form.title.length > 100) {
        errs.title = "Title must be less than 100 characters"
      }
      if (form.description && form.description.length > 500) {
        errs.description = "Description must be less than 500 characters"
      }
    }

    if (!step || step === 2) {
      if (!form.price || Number(form.price) <= 0) {
        errs.price = "Price must be greater than 0"
      }
      if (form.price && Number(form.price) > 10000) {
        errs.price = "Price seems too high. Please verify."
      }
      if (!form.category) {
        errs.category = "Please select a category"
      }
    }

    if (!step || step === 3) {
      if (!form.images || form.images.length === 0) {
        errs.images = "At least one photo helps your item sell faster"
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const nextStep = () => {
    if (validate(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setStatus("loading")

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const token = localStorage.getItem("token")
      
      const payload = {
        ...form,
        sellerId: user.id,
      }
      delete payload.images

      const res = await fetch("/api/equipment", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-auth-token": token 
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to submit")
      
      // If we have images and product was created successfully, upload them
      if (form.images && form.images.length > 0 && data.product && data.product._id) {
        // Create form data to upload images
        const formData = new FormData()
        Array.from(form.images).forEach((file, index) => {
          formData.append("images", file)
        })
        
        // Upload images to equipment service
        const token = localStorage.getItem("token")
        const uploadRes = await fetch(`/api/equipment/${data.product._id}/images`, {
          method: "POST",
          headers: {
            "x-auth-token": token
          },
          body: formData
        })
        
        if (!uploadRes.ok) {
          console.error("Image upload failed but product was created")
        }
      }

      setStatus("success")
      setForm({ title: "", description: "", price: "", currency: "USD", category: "Other", images: [] })
      setErrors({})
      setCurrentStep(1)
    } catch (err) {
      console.error("Submission error:", err)
      setStatus("error")
    }
  }

  const isStepComplete = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        return form.title.length >= 3
      case 2:
        return form.price && Number(form.price) > 0 && form.category
      case 3:
        return form.images && form.images.length > 0
      default:
        return false
    }
  }

  const completedSteps = FORM_STEPS.filter((_, index) => isStepComplete(index + 1)).length
  const progressPercentage = (completedSteps / FORM_STEPS.length) * 100

  return (
    <div className="min-h-screen bg-background">
      <div className="premium-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <Container className="relative py-16 lg:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Premium Marketplace
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white text-balance mb-6">List Your Sports Equipment</h1>
            <p className="text-xl text-white/80 text-pretty max-w-2xl mx-auto mb-8">
              Join thousands of athletes selling their gear on our premium marketplace. Professional listings, verified
              buyers, secure transactions.
            </p>

            <div className="flex items-center justify-center gap-8 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Secure Payments
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Verified Buyers
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Fast Sales
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Create Your Listing</h2>
                <p className="text-sm text-muted-foreground">
                  Step {currentStep} of {FORM_STEPS.length} • {FORM_STEPS[currentStep - 1]?.estimatedTime} remaining
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">{Math.round(progressPercentage)}% Complete</div>
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {FORM_STEPS.map((step, index) => {
                const Icon = step.icon
                const isActive = currentStep === step.id
                const isCompleted = isStepComplete(step.id)

                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-all duration-300 ${
                          isCompleted
                            ? "border-success bg-success text-success-foreground shadow-lg shadow-success/25"
                            : isActive
                              ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25 pulse-glow"
                              : "border-muted bg-card text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <div className="mt-3 text-center">
                        <div
                          className={`text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {step.title}
                        </div>
                        <div className="text-xs text-muted-foreground hidden sm:block mt-1">{step.description}</div>
                      </div>
                    </div>
                    {index < FORM_STEPS.length - 1 && (
                      <div
                        className={`w-16 h-0.5 mx-6 transition-all duration-500 ${
                          currentStep > step.id ? "bg-gradient-to-r from-success to-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <Card className="premium-card p-8 lg:p-12">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                submit(e)
              }}
              className="space-y-8"
            >
              {/* Step 1: Equipment Details */}
              {currentStep === 1 && (
                <div className="space-y-8 animate-in fade-in-50 duration-500">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Equipment Details</h2>
                      <p className="text-muted-foreground">Tell us about your sports equipment</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <TextInput
                      name="title"
                      label="Equipment Title"
                      placeholder="e.g., Wilson Pro Staff Tennis Racket - Excellent Condition"
                      value={form.title}
                      onChange={handleChange}
                      error={errors.title}
                      className="text-lg bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                    />

                    <div>
                      <label className="block text-sm font-semibold mb-3 text-foreground">
                        Description <span className="text-muted-foreground font-normal">(Optional)</span>
                      </label>
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Describe the condition, features, and any important details about your equipment. Include brand, model, size, and any wear or damage..."
                        className="w-full p-4 rounded-xl resize-none min-h-[140px] text-foreground placeholder:text-muted-foreground bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring/50"
                        rows={6}
                        maxLength={500}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-xs text-muted-foreground">Detailed descriptions get 3x more inquiries</div>
                        <div
                          className={`text-xs ${form.description.length > 450 ? "text-warning" : "text-muted-foreground"}`}
                        >
                          {form.description.length}/500 characters
                        </div>
                      </div>
                      {errors.description && (
                        <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Pricing & Category */}
              {currentStep === 2 && (
                <div className="space-y-8 animate-in fade-in-50 duration-500">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                      <DollarSign className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Pricing & Category</h2>
                      <p className="text-muted-foreground">Set competitive pricing and choose the right category</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="relative">
                        <TextInput
                          name="price"
                          label="Price (USD)"
                          placeholder="0.00"
                          value={form.price}
                          onChange={handleChange}
                          error={errors.price}
                          type="number"
                          step="0.01"
                          min="0"
                          className="pl-10 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                        />
                        <DollarSign className="absolute left-3 top-9 w-5 h-5 text-muted-foreground" />
                      </div>

                      <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">Pricing Tips</span>
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• Research similar items to price competitively</li>
                          <li>• Consider condition and original retail price</li>
                          <li>• Leave room for negotiation (10-15%)</li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-4 text-foreground">Category</label>
                      <div className="grid grid-cols-1 gap-3">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => setField("category", cat.value)}
                            className={`glow-border p-4 rounded-xl border-2 transition-all duration-300 text-left hover:scale-[1.02] group ${
                              form.category === cat.value
                                ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/20"
                                : "border-border bg-card hover:border-primary/30 hover:bg-primary/5"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">{cat.icon}</div>
                              <div>
                                <div className="font-semibold">{cat.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {cat.value === "Tennis" && "Rackets, balls, shoes, apparel"}
                                  {cat.value === "Football" && "Cleats, balls, protective gear"}
                                  {cat.value === "Basketball" && "Shoes, balls, hoops, apparel"}
                                  {cat.value === "Fitness" && "Weights, machines, accessories"}
                                  {cat.value === "Other" && "All other sports equipment"}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      {errors.category && (
                        <p className="text-sm text-destructive mt-3 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.category}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Photos & Review */}
              {currentStep === 3 && (
                <div className="space-y-8 animate-in fade-in-50 duration-500">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                      <Camera className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Photos & Review</h2>
                      <p className="text-muted-foreground">Add high-quality photos and review your listing</p>
                    </div>
                  </div>

                  <div className="glow-border border-2 border-dashed border-border/50 rounded-2xl p-8 text-center hover:border-primary/50 transition-all duration-300 bg-muted/20">
                    <FileUpload onChange={handleFiles} maxFiles={4} accept="image/*" className="w-full" />
                    <div className="mt-6">
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Upload Your Photos</h3>
                      <p className="text-muted-foreground mb-4">Drop your images here or click to browse</p>
                      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                        <span>Up to 4 images</span>
                        <span>Max 5MB each</span>
                        <span>JPG, PNG, WebP</span>
                      </div>
                    </div>
                    {errors.images && (
                      <p className="text-sm text-destructive mt-4 flex items-center justify-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.images}
                      </p>
                    )}
                  </div>

                  {previews.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4">Photo Preview</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {previews.map((preview) => (
                          <div key={preview.id} className="relative group">
                            <div className="glow-border aspect-square rounded-xl overflow-hidden border border-border bg-muted">
                              <img
                                src={preview.url || "/placeholder.svg"}
                                alt={preview.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(preview.id)}
                              className="absolute -top-2 -right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <div className="mt-2 text-center">
                              <div className="text-xs text-foreground font-medium truncate">{preview.name}</div>
                              <div className="text-xs text-muted-foreground">{preview.size}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {form.title && (
                    <div className="premium-card p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Listing Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Title:</span>
                          <p className="font-medium text-foreground">{form.title}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Price:</span>
                          <p className="font-medium text-foreground">${form.price}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Category:</span>
                          <p className="font-medium text-foreground">{form.category}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Photos:</span>
                          <p className="font-medium text-foreground">{form.images.length} uploaded</p>
                        </div>
                      </div>
                      {form.description && (
                        <div>
                          <span className="text-muted-foreground text-sm">Description:</span>
                          <p className="text-sm text-foreground mt-1">{form.description}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-8 border-t border-border">
                <div className="flex items-center gap-3">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="px-6 bg-transparent border-border hover:bg-muted"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {status === "success" && (
                    <div className="flex items-center gap-2 text-success text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Submitted successfully!
                    </div>
                  )}
                  {status === "error" && (
                    <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                      <AlertCircle className="w-4 h-4" />
                      Submission failed. Please try again.
                    </div>
                  )}

                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="px-8"
                      disabled={!isStepComplete(currentStep)}
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="px-8"
                      disabled={status === "loading"}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {status === "loading" ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Publishing Listing...
                        </div>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Publish Listing
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Card>

          {status === "success" && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
              <div className="premium-card rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-500">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-success to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-success/25">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">Listing Submitted!</h3>
                  <p className="text-muted-foreground mb-8 text-pretty leading-relaxed">
                    Congratulations! Your equipment listing has been submitted successfully. Our team will review it
                    within 24 hours and notify you once it's live on the marketplace.
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={() => setStatus(null)}
                      className="w-full"
                    >
                      Create Another Listing
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-border hover:bg-muted bg-transparent"
                    >
                      View My Listings
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}
