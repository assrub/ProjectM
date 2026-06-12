using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEngine;

public class BuildScript
{
    public static void BuildAndroid()
    {
        var buildOptions = new BuildPlayerOptions
        {
            scenes = new[]
            {
                "Assets/Scenes/Boot.unity",
                "Assets/Scenes/MainMenu.unity",
                "Assets/Scenes/Game.unity"
            },
            locationPathName = "Builds/MuOnlineMobile.apk",
            target = BuildTarget.Android,
            options = BuildOptions.None
        };

        var report = BuildPipeline.BuildPlayer(buildOptions);
        var summary = report.summary;

        if (summary.result == BuildResult.Succeeded)
        {
            Debug.Log("Build succeeded: " + summary.totalSize + " bytes");
        }
        else
        {
            Debug.LogError("Build failed: " + summary.result + " " + summary.totalErrors + " errors");
            EditorApplication.Exit(1);
        }
    }

    public static void BuildWebGL()
    {
        var buildOptions = new BuildPlayerOptions
        {
            scenes = new[]
            {
                "Assets/Scenes/Boot.unity",
                "Assets/Scenes/MainMenu.unity",
                "Assets/Scenes/Game.unity"
            },
            locationPathName = "Builds/WebGL",
            target = BuildTarget.WebGL,
            options = BuildOptions.None
        };

        var report = BuildPipeline.BuildPlayer(buildOptions);
        var summary = report.summary;

        if (summary.result == BuildResult.Succeeded)
        {
            Debug.Log("WebGL build succeeded: " + summary.totalSize + " bytes");
        }
        else
        {
            Debug.LogError("WebGL build failed: " + summary.result + " " + summary.totalErrors + " errors");
            EditorApplication.Exit(1);
        }
    }
}
