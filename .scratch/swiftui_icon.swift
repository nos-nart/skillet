import SwiftUI
import AppKit

let inputPath = "/Users/nartnos/.gemini/antigravity/brain/a1bf1081-018e-41d4-b081-de2d545ff175/skillet_icon_flat_1787829605425.jpg"
let outputPath = "/Users/nartnos/Developer/work/skillet/public/icon.png"

guard let nsImage = NSImage(contentsOfFile: inputPath) else {
    print("Failed to load input image")
    exit(1)
}

// macOS icon specs: 1024x1024 canvas, ~824x824 icon body, ~185pt corner radius
// deno desktop does NOT auto-mask, so we draw the squircle ourselves.
struct IconView: View {
    let image: Image

    var body: some View {
        let canvasSize: CGFloat = 1024
        let iconSize: CGFloat = 824
        let cornerRadius: CGFloat = iconSize * 0.225  // ~185

        ZStack {
            // Drop shadow (drawn behind the clipped image)
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill(Color.black.opacity(0.001)) // nearly invisible fill for shadow attachment
                .frame(width: iconSize, height: iconSize)
                .shadow(color: Color.black.opacity(0.35), radius: 18, x: 0, y: 14)

            // Clipped image
            image
                .resizable()
                .scaleEffect(1.0 / 0.68) // crop out original image margins
                .frame(width: iconSize, height: iconSize)
                .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))

            // Subtle inner border
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .strokeBorder(Color.black.opacity(0.12), lineWidth: 1)
                .frame(width: iconSize, height: iconSize)
        }
        .frame(width: canvasSize, height: canvasSize)
    }
}

@MainActor
func renderIcon() {
    let view = IconView(image: Image(nsImage: nsImage))
    let renderer = ImageRenderer(content: view)
    renderer.scale = 1.0
    renderer.isOpaque = false

    guard let cgImage = renderer.cgImage else {
        print("Failed to render cgImage")
        exit(1)
    }

    let bitmapRep = NSBitmapImageRep(cgImage: cgImage)
    guard let pngData = bitmapRep.representation(using: .png, properties: [:]) else {
        print("Failed to convert to PNG")
        exit(1)
    }

    do {
        try pngData.write(to: URL(fileURLWithPath: outputPath))
        print("Generated macOS-style squircle icon at: \(outputPath)")
    } catch {
        print("Failed to write output: \(error)")
        exit(1)
    }
}

Task { @MainActor in
    renderIcon()
    exit(0)
}

RunLoop.main.run()
