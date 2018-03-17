package net.creasource.web

import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import akka.http.scaladsl.settings.RoutingSettings
import akka.pattern.ask
import net.creasource.core.Application
import net.creasource.web.LibraryActor.{GetLibraries, Libraries}

import scala.concurrent.duration._

class AudioLibraryRoutes(application: Application) {

  implicit val settings: RoutingSettings = RoutingSettings.apply(application.config)

  implicit val askTimeout: akka.util.Timeout = 2.seconds

  def routes: Route =
    pathPrefix("music") {
      onSuccess((application.libraryActor ? GetLibraries).mapTo[Libraries]) { libraries =>
        Route.seal(libraries.libraries.map(getFromBrowseableDirectory).fold(reject())(_ ~ _))
      }
    }

}
